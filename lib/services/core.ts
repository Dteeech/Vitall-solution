import { createServerSupabaseClient } from '../supabase'
import { getCurrentUser } from '../auth'

export class AuditService {
  static async log(
    action: string,
    entity: string,
    entityId?: string,
    payload?: Record<string, any>
  ) {
    const user = await getCurrentUser()
    if (!user) return

    const supabase = createServerSupabaseClient()

    try {
      await supabase
        .from('audit_log')
        .insert({
          organization_id: user.organizationId,
          actor_id: user.id,
          action,
          entity,
          entity_id: entityId,
          payload: payload || {},
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log audit entry:', error)
    }
  }

  static async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      entity?: string
      action?: string
      actorId?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('audit_log')
      .select(`
        *,
        profiles!audit_log_actor_id_fkey(full_name, email)
      `)
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.entity) {
      query = query.eq('entity', filters.entity)
    }
    
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    
    if (filters?.actorId) {
      query = query.eq('actor_id', filters.actorId)
    }
    
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString())
    }
    
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString())
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

export class OrganizationService {
  static async getOrganization() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organizationId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch organization: ${error.message}`)
    }

    return data
  }

  static async updateOrganization(updates: {
    name?: string
    settings?: Record<string, any>
  }) {
    const user = await getCurrentUser()
    if (!user || !['admin', 'owner'].includes(user.role)) {
      throw new Error('Insufficient permissions')
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update organization: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('update', 'organization', user.organizationId, updates)

    return data
  }

  static async getOrganizationStats() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    // Get counts for various entities
    const [
      { count: userCount },
      { count: moduleCount },
      { count: auditCount }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('is_active', true),
      supabase
        .from('core_organization_module')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('enabled', true),
      supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    ])

    return {
      activeUsers: userCount || 0,
      enabledModules: moduleCount || 0,
      recentAuditEntries: auditCount || 0
    }
  }
}

export class UserService {
  static async getUsers() {
    const user = await getCurrentUser()
    if (!user || !['admin', 'owner'].includes(user.role)) {
      throw new Error('Insufficient permissions')
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data || []
  }

  static async updateUserRole(userId: string, role: 'admin' | 'member') {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      throw new Error('Only organization owners can change user roles')
    }

    if (userId === user.id) {
      throw new Error('Cannot change your own role')
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('organization_id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('update_role', 'user', userId, { role })

    return data
  }

  static async deactivateUser(userId: string) {
    const user = await getCurrentUser()
    if (!user || !['admin', 'owner'].includes(user.role)) {
      throw new Error('Insufficient permissions')
    }

    if (userId === user.id) {
      throw new Error('Cannot deactivate yourself')
    }

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('organization_id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('deactivate', 'user', userId)

    return data
  }
}