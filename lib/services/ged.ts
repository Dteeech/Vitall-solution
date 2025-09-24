import { createServerSupabaseClient } from '../supabase'
import { getCurrentUser } from '../auth'
import { AuditService } from './core'

export interface CreateDocumentData {
  name: string
  description?: string
  folderId?: string
  filePath: string
  fileSize: number
  mimeType: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateDocumentData {
  name?: string
  description?: string
  folderId?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CreateFolderData {
  name: string
  description?: string
  parentId?: string
}

export class GEDService {
  static async getFolders() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('ged_folder')
      .select('*')
      .eq('organization_id', user.organizationId)
      .order('path', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch folders: ${error.message}`)
    }

    return data || []
  }

  static async createFolder(folderData: CreateFolderData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('ged_folder')
      .insert({
        ...folderData,
        organization_id: user.organizationId,
        created_by: user.id,
        parent_id: folderData.parentId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'folder', data.id, folderData)

    return data
  }

  static async getDocuments(filters?: {
    folderId?: string
    search?: string
    tags?: string[]
    limit?: number
    offset?: number
  }) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    let query = supabase
      .from('ged_document')
      .select(`
        *,
        folder:ged_folder(name, path)
      `)
      .eq('organization_id', user.organizationId)
      .eq('is_current_version', true)

    // Apply filters
    if (filters?.folderId) {
      query = query.eq('folder_id', filters.folderId)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    // Pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return data || []
  }

  static async getDocument(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('ged_document')
      .select(`
        *,
        folder:ged_folder(name, path),
        versions:ged_document!parent_document_id(*)
      `)
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch document: ${error.message}`)
    }

    return data
  }

  static async createDocument(documentData: CreateDocumentData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('ged_document')
      .insert({
        ...documentData,
        organization_id: user.organizationId,
        created_by: user.id,
        folder_id: documentData.folderId,
        file_path: documentData.filePath,
        file_size: documentData.fileSize,
        mime_type: documentData.mimeType,
        tags: documentData.tags || [],
        metadata: documentData.metadata || {}
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create document: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('create', 'document', data.id, documentData)

    return data
  }

  static async updateDocument(id: string, updates: UpdateDocumentData) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()

    const updateData: any = { 
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.folderId !== undefined) {
      updateData.folder_id = updates.folderId
      delete updateData.folderId
    }

    const { data, error } = await supabase
      .from('ged_document')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organizationId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`)
    }

    // Log audit entry
    await AuditService.log('update', 'document', id, updates)

    return data
  }

  static async deleteDocument(id: string) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    // Get document info for storage cleanup
    const document = await this.getDocument(id)
    
    const { error } = await supabase
      .from('ged_document')
      .delete()
      .eq('id', id)
      .eq('organization_id', user.organizationId)

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`)
    }

    // TODO: Clean up storage file
    // await supabase.storage.from('ged').remove([document.file_path])

    // Log audit entry
    await AuditService.log('delete', 'document', id)
  }

  static async getDocumentStats() {
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createServerSupabaseClient()
    
    const [
      { count: totalDocs },
      { count: totalFolders },
      { data: recentDocs }
    ] = await Promise.all([
      supabase
        .from('ged_document')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('is_current_version', true),
      supabase
        .from('ged_folder')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId),
      supabase
        .from('ged_document')
        .select('file_size')
        .eq('organization_id', user.organizationId)
        .eq('is_current_version', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    const totalSize = (recentDocs || []).reduce((sum, doc) => sum + (doc.file_size || 0), 0)

    return {
      totalDocuments: totalDocs || 0,
      totalFolders: totalFolders || 0,
      recentDocuments: recentDocs?.length || 0,
      totalStorageBytes: totalSize
    }
  }

  static generateStoragePath(organizationId: string, documentId: string, filename: string): string {
    return `ged/${organizationId}/${documentId}/${filename}`
  }
}