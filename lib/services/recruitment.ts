import { createServerSupabaseClient } from '../supabase'
import { getCurrentUser } from '../auth'
import { AuditService } from './core'

export interface CreateCandidateData {
  name: string
  email: string
  phone?: string
  linkedinUrl?: string
  cvUrl?: string
  notes?: string
  tags?: string[]
}

export interface UpdateCandidateData extends Partial<CreateCandidateData> {
  status?: 'pending' | 'interview' | 'hired' | 'rejected'
  score?: number
}

export class RecruitmentService {
  static async getCandidates(filters?: {
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('recruitment_candidate')
      .select('*')
      .eq('organization_id', user.organizationId)

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // Pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch candidates: ${error.message}`)
    }

    return data || []
  }

  static async getCandidate(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('recruitment_candidate')
      .select('*')
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch candidate: ${error.message}`)
    }

    return data
  }

  static async createCandidate(candidateData: CreateCandidateData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('recruitment_candidate')
      .select('id')
      .eq('email', candidateData.email)
      .eq('organization_id', user.organizationId)
      .single()

    if (existing) {
      throw new Error('Candidate with this email already exists')
    }

    const { data, error } = await supabase
      .from('recruitment_candidate')
      .insert({
        ...candidateData,
        organization_id: user.organizationId,
        created_by: user.id,
        cv_url: candidateData.cvUrl,
        linkedin_url: candidateData.linkedinUrl,
        tags: candidateData.tags || []
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create candidate: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'candidate', data.id, candidateData)

    return data
  }

  static async updateCandidate(id: string, updates: UpdateCandidateData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const updateData: any = { ...updates }
    
    // Handle URL field mapping
    if (updates.cvUrl !== undefined) {
      updateData.cv_url = updates.cvUrl
      delete updateData.cvUrl
    }
    
    if (updates.linkedinUrl !== undefined) {
      updateData.linkedin_url = updates.linkedinUrl
      delete updateData.linkedinUrl
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('recruitment_candidate')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update candidate: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('update', 'candidate', id, updates)

    return data
  }

  static async deleteCandidate(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase
      .from('recruitment_candidate')
      .delete()
      .eq('id', id)
      .eq('organization_id', user.organizationId)

    if (error) {
      throw new Error(`Failed to delete candidate: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('delete', 'candidate', id)
  }

  static async getCandidateStats() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    // Get status counts
    const { data: statusCounts, error: statusError } = await supabase
      .from('recruitment_candidate')
      .select('status')
      .eq('organization_id', user.organizationId)

    if (statusError) {
      throw new Error(`Failed to fetch candidate stats: ${statusError.message}`)
    }

    const stats = statusCounts?.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent candidates (last 7 days)
    const { count: recentCount } = await supabase
      .from('recruitment_candidate')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organizationId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    return {
      total: statusCounts?.length || 0,
      byStatus: {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        hired: stats.hired || 0,
        rejected: stats.rejected || 0
      },
      recentCount: recentCount || 0
    }
  }

  // Simple scoring algorithm - can be enhanced
  static calculateScore(candidate: any): number {
    let score = 20 // Base score

    // Has CV
    if (candidate.cv_url) score += 25

    // Has LinkedIn
    if (candidate.linkedin_url) score += 15

    // Has phone
    if (candidate.phone) score += 10

    // Email domain scoring
    if (candidate.email.includes('@gmail.com')) {
      score += 5
    } else if (candidate.email.includes('@linkedin.com') || candidate.email.includes('@microsoft.com')) {
      score += 20
    }

    // Tags (skills/experience)
    if (candidate.tags?.length) {
      score += Math.min(candidate.tags.length * 2, 20)
    }

    return Math.min(score, 100)
  }

  static async recalculateScore(id: string) {
    const candidate = await this.getCandidate(id)
    const newScore = this.calculateScore(candidate)
    
    return await this.updateCandidate(id, { score: newScore })
  }
}