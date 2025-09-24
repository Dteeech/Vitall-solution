import { createServerSupabaseClient } from '../supabase'
import { getCurrentUser } from '../auth'
import { AuditService } from './core'

export interface CreateTimesheetEntryData {
  projectId?: string
  date: string
  startTime?: string
  endTime?: string
  hours: number
  description?: string
  isBillable?: boolean
}

export interface UpdateTimesheetEntryData extends Partial<CreateTimesheetEntryData> {
  status?: 'draft' | 'submitted' | 'approved' | 'rejected'
}

export interface CreateProjectData {
  name: string
  description?: string
  code?: string
  hourlyRate?: number
  budgetHours?: number
}

export class TimesheetService {
  static async getProjects() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('timesheet_project')
      .select('*')
      .eq('organization_id', user.organizationId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }

    return data || []
  }

  static async createProject(projectData: CreateProjectData) {
    const user = await getCurrentUser()
    if (!user || !['admin', 'owner'].includes(user.role)) {
      throw new Error('Insufficient permissions')
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('timesheet_project')
      .insert({
        ...projectData,
        organization_id: user.organizationId,
        created_by: user.id,
        hourly_rate: projectData.hourlyRate,
        budget_hours: projectData.budgetHours
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'timesheet_project', data.id, projectData)

    return data
  }

  static async getEntries(filters?: {
    userId?: string
    projectId?: string
    dateFrom?: string
    dateTo?: string
    status?: string
    limit?: number
    offset?: number
  }) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('timesheet_entry')
      .select(`
        *,
        project:timesheet_project(name, code, hourly_rate),
        user:profiles(full_name, email)
      `)
      .eq('organization_id', user.organizationId)

    // Non-admin users can only see their own entries
    if (!['admin', 'owner'].includes(user.role)) {
      query = query.eq('user_id', user.id)
    } else if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    // Apply other filters
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo)
    }

    // Pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    query = query.order('date', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch timesheet entries: ${error.message}`)
    }

    return data || []
  }

  static async getEntry(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('timesheet_entry')
      .select(`
        *,
        project:timesheet_project(name, code, hourly_rate),
        user:profiles(full_name, email)
      `)
      .eq('id', id)
      .eq('organization_id', user.organizationId)

    // Non-admin users can only see their own entries
    if (!['admin', 'owner'].includes(user.role)) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query.single()

    if (error) {
      throw new Error(`Failed to fetch timesheet entry: ${error.message}`)
    }

    return data
  }

  static async createEntry(entryData: CreateTimesheetEntryData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const insertData = {
      ...entryData,
      organization_id: user.organizationId,
      user_id: user.id,
      project_id: entryData.projectId,
      start_time: entryData.startTime,
      end_time: entryData.endTime,
      is_billable: entryData.isBillable ?? true
    }

    const { data, error } = await supabase
      .from('timesheet_entry')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create timesheet entry: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'timesheet_entry', data.id, entryData)

    return data
  }

  static async updateEntry(id: string, updates: UpdateTimesheetEntryData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    // Check ownership for non-admin users
    if (!['admin', 'owner'].includes(user.role)) {
      const entry = await this.getEntry(id)
      if (entry.user_id !== user.id) {
        throw new Error('You can only edit your own timesheet entries')
      }
    }

    const updateData: any = { 
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Handle field mapping
    if (updates.projectId !== undefined) {
      updateData.project_id = updates.projectId
      delete updateData.projectId
    }
    
    if (updates.startTime !== undefined) {
      updateData.start_time = updates.startTime
      delete updateData.startTime
    }
    
    if (updates.endTime !== undefined) {
      updateData.end_time = updates.endTime
      delete updateData.endTime
    }
    
    if (updates.isBillable !== undefined) {
      updateData.is_billable = updates.isBillable
      delete updateData.isBillable
    }

    const { data, error } = await supabase
      .from('timesheet_entry')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update timesheet entry: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('update', 'timesheet_entry', id, updates)

    return data
  }

  static async deleteEntry(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    // Check ownership for non-admin users
    if (!['admin', 'owner'].includes(user.role)) {
      const entry = await this.getEntry(id)
      if (entry.user_id !== user.id) {
        throw new Error('You can only delete your own timesheet entries')
      }
    }
    
    const { error } = await supabase
      .from('timesheet_entry')
      .delete()
      .eq('id', id)
      .eq('organization_id', user.organizationId)

    if (error) {
      throw new Error(`Failed to delete timesheet entry: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('delete', 'timesheet_entry', id)
  }

  static async getTimesheetStats(userId?: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    let baseQuery = supabase
      .from('timesheet_entry')
      .select('*')
      .eq('organization_id', user.organizationId)

    // Filter by user if specified and user has permission
    if (userId) {
      if (!['admin', 'owner'].includes(user.role) && userId !== user.id) {
        throw new Error('Insufficient permissions')
      }
      baseQuery = baseQuery.eq('user_id', userId)
    } else if (!['admin', 'owner'].includes(user.role)) {
      // Non-admin users see only their own stats
      baseQuery = baseQuery.eq('user_id', user.id)
    }

    // Get current month stats
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const { data: monthEntries } = await baseQuery
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0])

    const { data: allEntries } = await baseQuery

    const monthlyStats = (monthEntries || []).reduce((acc, entry) => {
      acc.totalHours += Number(entry.hours)
      if (entry.is_billable) acc.billableHours += Number(entry.hours)
      if (entry.status === 'approved') acc.approvedHours += Number(entry.hours)
      return acc
    }, { totalHours: 0, billableHours: 0, approvedHours: 0 })

    const totalEntries = allEntries?.length || 0

    return {
      currentMonth: {
        ...monthlyStats,
        entryCount: monthEntries?.length || 0
      },
      overall: {
        totalEntries,
        totalHours: allEntries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0
      }
    }
  }
}