import { createServerSupabaseClient } from '../supabase'
import { getCurrentUser } from '../auth'
import { AuditService } from './core'

export interface CreateInventoryItemData {
  sku: string
  name: string
  description?: string
  category?: string
  unit?: string
  unitCost?: number
  sellingPrice?: number
  currentStock?: number
  reorderPoint?: number
  maxStock?: number
  metadata?: Record<string, any>
}

export interface UpdateInventoryItemData extends Partial<CreateInventoryItemData> {
  isActive?: boolean
}

export class InventoryService {
  static async getItems(filters?: {
    category?: string
    search?: string
    lowStock?: boolean
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('inventory_item')
      .select('*')
      .eq('organization_id', user.organizationId)

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(`sku.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
    }

    if (filters?.lowStock === true) {
      query = query.filter('current_stock', 'lte', 'reorder_point')
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    // Pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch inventory items: ${error.message}`)
    }

    return data || []
  }

  static async getItem(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('inventory_item')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch inventory item: ${error.message}`)
    }

    return data
  }

  static async createItem(itemData: CreateInventoryItemData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    // Check for duplicate SKU
    const { data: existing } = await supabase
      .from('inventory_item')
      .select('id')
      .eq('sku', itemData.sku)
      .eq('organization_id', user.organizationId)
      .single()

    if (existing) {
      throw new Error('Item with this SKU already exists')
    }

    const insertData = {
      ...itemData,
      organization_id: user.organizationId,
      unit_cost: itemData.unitCost,
      selling_price: itemData.sellingPrice,
      current_stock: itemData.currentStock || 0,
      reorder_point: itemData.reorderPoint || 0,
      max_stock: itemData.maxStock,
      metadata: itemData.metadata || {}
    }

    const { data, error } = await supabase
      .from('inventory_item')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create inventory item: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'inventory_item', data.id, itemData)

    return data
  }

  static async updateItem(id: string, updates: UpdateInventoryItemData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const updateData: any = { 
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Handle field mapping
    if (updates.unitCost !== undefined) {
      updateData.unit_cost = updates.unitCost
      delete updateData.unitCost
    }
    
    if (updates.sellingPrice !== undefined) {
      updateData.selling_price = updates.sellingPrice
      delete updateData.sellingPrice
    }
    
    if (updates.currentStock !== undefined) {
      updateData.current_stock = updates.currentStock
      delete updateData.currentStock
    }
    
    if (updates.reorderPoint !== undefined) {
      updateData.reorder_point = updates.reorderPoint
      delete updateData.reorderPoint
    }
    
    if (updates.maxStock !== undefined) {
      updateData.max_stock = updates.maxStock
      delete updateData.maxStock
    }
    
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive
      delete updateData.isActive
    }

    const { data, error } = await supabase
      .from('inventory_item')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update inventory item: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('update', 'inventory_item', id, updates)

    return data
  }

  static async deleteItem(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('inventory_item')
      .delete()
      .eq('id', id)
      .eq('organization_id', user.organizationId)

    if (error) {
      throw new Error(`Failed to delete inventory item: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('delete', 'inventory_item', id)
  }

  static async getLowStockItems() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('inventory_item')
      .select('*')
      .eq('organization_id', user.organizationId)
      .eq('is_active', true)
      .filter('current_stock', 'lte', 'reorder_point')
      .order('current_stock', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch low stock items: ${error.message}`)
    }

    return data || []
  }

  static async getInventoryStats() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const [
      { count: totalItems },
      { count: activeItems },
      { count: lowStockItems },
      { data: stockValue }
    ] = await Promise.all([
      supabase
        .from('inventory_item')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId),
      supabase
        .from('inventory_item')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('is_active', true),
      supabase
        .from('inventory_item')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .filter('current_stock', 'lte', 'reorder_point'),
      supabase
        .from('inventory_item')
        .select('current_stock, unit_cost')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .not('unit_cost', 'is', null)
    ])

    const totalStockValue = (stockValue || []).reduce((sum, item) => 
      sum + (item.current_stock * (item.unit_cost || 0)), 0
    )

    return {
      totalItems: totalItems || 0,
      activeItems: activeItems || 0,
      lowStockItems: lowStockItems || 0,
      totalStockValue,
      categories: await this.getCategoryStats()
    }
  }

  private static async getCategoryStats() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('inventory_item')
      .select('category')
      .eq('organization_id', user.organizationId)
      .eq('is_active', true)

    if (error) return {}

    return (data || []).reduce((acc, item) => {
      const category = item.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}