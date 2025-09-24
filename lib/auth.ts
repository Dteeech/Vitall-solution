import { createServerSupabaseClient } from './supabase'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export type UserRole = 'owner' | 'admin' | 'member'

export interface AuthUser {
  id: string
  email: string
  organizationId: string
  role: UserRole
  fullName?: string
  avatarUrl?: string
}

// Cache the current user lookup to avoid multiple calls
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = createServerSupabaseClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  // Get organization ID from user metadata
  const organizationId = user.user_metadata?.organization_id
  
  if (!organizationId) {
    return null
  }

  // Get user profile with role information
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: user.id,
    email: profile.email,
    organizationId: profile.organization_id,
    role: profile.role as UserRole,
    fullName: profile.full_name || undefined,
    avatarUrl: profile.avatar_url || undefined,
  }
})

export const getCurrentOrganizationId = async (): Promise<string | null> => {
  const user = await getCurrentUser()
  return user?.organizationId || null
}

// Guard function to require authentication
export const requireAuth = async (): Promise<AuthUser> => {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

// Guard function to require specific role
export const requireRole = async (requiredRole: UserRole | UserRole[]): Promise<AuthUser> => {
  const user = await requireAuth()
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  
  if (!roles.includes(user.role)) {
    redirect('/dashboard?error=insufficient_permissions')
  }
  
  return user
}

// Check if user has admin privileges
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return user ? ['admin', 'owner'].includes(user.role) : false
}

// Check if user is organization owner
export const isOwner = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return user?.role === 'owner'
}

// Get organization context for the current user
export const getOrganizationContext = async () => {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const supabase = createServerSupabaseClient()
  
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.organizationId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return {
    user,
    organization
  }
}

// Utility to check if a module is enabled for the current organization
export const isModuleEnabled = async (moduleName: string): Promise<boolean> => {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }

  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('core_organization_module')
    .select('enabled')
    .eq('organization_id', user.organizationId)
    .eq('module_name', moduleName)
    .single()

  if (error || !data) {
    return false
  }

  return data.enabled
}

// Guard function to require module access
export const requireModule = async (moduleName: string): Promise<void> => {
  await requireAuth()
  
  const moduleEnabled = await isModuleEnabled(moduleName)
  
  if (!moduleEnabled) {
    redirect('/dashboard?error=module_not_enabled')
  }
}