import { createServerSupabaseClient } from './supabase'
import { getCurrentUser } from './auth'
import { Database } from './types/database'

export type Module = Database['public']['Tables']['core_module']['Row']
export type OrganizationModule = Database['public']['Tables']['core_organization_module']['Row'] & {
  module: Module
}

// Get all available modules
export const getAvailableModules = async (): Promise<Module[]> => {
  const supabase = createServerSupabaseClient()
  
  const { data: modules, error } = await supabase
    .from('core_module')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (error) {
    console.error('Error fetching modules:', error)
    return []
  }

  return modules || []
}

// Get enabled modules for current organization
export const getEnabledModules = async (): Promise<OrganizationModule[]> => {
  const user = await getCurrentUser()
  
  if (!user) {
    return []
  }

  const supabase = createServerSupabaseClient()
  
  const { data: orgModules, error } = await supabase
    .from('core_organization_module')
    .select(`
      *,
      module:core_module(*)
    `)
    .eq('organization_id', user.organizationId)
    .eq('enabled', true)
    .order('installed_at', { ascending: true })

  if (error) {
    console.error('Error fetching organization modules:', error)
    return []
  }

  return (orgModules || []).map(orgModule => ({
    ...orgModule,
    module: orgModule.module as Module
  }))
}

// Get all modules with their enablement status for current organization
export const getModulesWithStatus = async (): Promise<(Module & { enabled: boolean })[]> => {
  const user = await getCurrentUser()
  
  if (!user) {
    return []
  }

  const supabase = createServerSupabaseClient()
  
  const { data: modules, error: modulesError } = await supabase
    .from('core_module')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  if (modulesError) {
    console.error('Error fetching modules:', modulesError)
    return []
  }

  const { data: orgModules, error: orgModulesError } = await supabase
    .from('core_organization_module')
    .select('module_name, enabled')
    .eq('organization_id', user.organizationId)

  if (orgModulesError) {
    console.error('Error fetching organization modules:', orgModulesError)
    return []
  }

  const enabledMap = new Map(
    (orgModules || []).map(om => [om.module_name, om.enabled])
  )

  return (modules || []).map(module => ({
    ...module,
    enabled: enabledMap.get(module.name) || false
  }))
}

// Check if a specific module is enabled for current organization
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
    // If module is not found, check if it's enabled by default
    const { data: moduleData, error: moduleError } = await supabase
      .from('core_module')
      .select('enabled_by_default')
      .eq('name', moduleName)
      .single()

    if (moduleError || !moduleData) {
      return false
    }

    return moduleData.enabled_by_default
  }

  return data.enabled
}

// Toggle module for current organization
export const toggleModule = async (
  moduleName: string, 
  enabled: boolean
): Promise<{ success: boolean; error?: string }> => {
  const user = await getCurrentUser()
  
  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Check if user has admin permissions
  if (!['admin', 'owner'].includes(user.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('core_organization_module')
    .upsert({
      organization_id: user.organizationId,
      module_name: moduleName,
      enabled,
      config: {},
      installed_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error toggling module:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get navigation items based on enabled modules
export const getNavigationItems = async () => {
  const enabledModules = await getEnabledModules()
  
  const baseItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'LayoutDashboard'
    }
  ]

  const moduleItems = enabledModules.map(({ module }) => ({
    name: module.title,
    href: `/modules/${module.name}`,
    icon: module.icon || 'Package'
  }))

  const adminItems = [
    {
      name: 'Admin',
      href: '/admin',
      icon: 'Settings',
      children: [
        { name: 'Modules', href: '/admin/modules' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Audit Log', href: '/admin/audit' }
      ]
    }
  ]

  return [
    ...baseItems,
    ...moduleItems,
    ...adminItems
  ]
}

// Module categories for organization
export const getModulesByCategory = async () => {
  const modules = await getModulesWithStatus()
  
  const categories = modules.reduce((acc, module) => {
    const category = module.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(module)
    return acc
  }, {} as Record<string, (Module & { enabled: boolean })[]>)

  return categories
}

// Get module statistics
export const getModuleStats = async () => {
  const modules = await getModulesWithStatus()
  
  return {
    total: modules.length,
    enabled: modules.filter(m => m.enabled).length,
    available: modules.filter(m => !m.enabled).length,
    byCategory: modules.reduce((acc, module) => {
      const category = module.category || 'other'
      acc[category] = (acc[category] || 0) + (module.enabled ? 1 : 0)
      return acc
    }, {} as Record<string, number>)
  }
}