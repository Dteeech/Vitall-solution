import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { requireRole } from '@/lib/auth'
import { getModulesByCategory } from '@/lib/module-registry'
import { ModuleToggle } from '@/components/modules/module-toggle'
import { 
  Users, 
  FileText, 
  Clock, 
  Package, 
  Calculator,
  Settings,
  Briefcase,
  DollarSign
} from 'lucide-react'

const categoryIcons: Record<string, React.ComponentType<any>> = {
  hr: Users,
  productivity: FileText,
  operations: Package,
  finance: Calculator,
  business: Briefcase,
  other: Settings
}

const categoryLabels: Record<string, string> = {
  hr: 'Human Resources',
  productivity: 'Productivity',
  operations: 'Operations',
  finance: 'Finance', 
  business: 'Business',
  other: 'Other'
}

const moduleIcons: Record<string, React.ComponentType<any>> = {
  recruitment: Users,
  ged: FileText,
  timesheets: Clock,
  inventory: Package,
  accounting: Calculator
}

export default async function AdminModulesPage() {
  await requireRole(['admin', 'owner'])

  const modulesByCategory = await getModulesByCategory()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Module Management</h1>
        <p className="text-muted-foreground">
          Enable or disable modules for your organization
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(modulesByCategory).map(([category, modules]) => {
          const CategoryIcon = categoryIcons[category] || Settings
          
          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{categoryLabels[category] || category}</CardTitle>
                </div>
                <CardDescription>
                  {category === 'hr' && 'Human resources and people management tools'}
                  {category === 'productivity' && 'Tools to enhance team productivity and collaboration'}
                  {category === 'operations' && 'Operational management and workflow tools'}
                  {category === 'finance' && 'Financial management and accounting tools'}
                  {category === 'business' && 'Core business management features'}
                  {category === 'other' && 'Additional modules and utilities'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {modules.map((module) => {
                    const ModuleIcon = moduleIcons[module.name] || Package
                    
                    return (
                      <div
                        key={module.name}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ModuleIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{module.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {module.description}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={module.enabled ? "default" : "secondary"}
                            className={module.enabled ? "bg-green-100 text-green-800 border-green-200" : ""}
                          >
                            {module.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <ModuleToggle
                            moduleName={module.name}
                            enabled={module.enabled}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Object.keys(modulesByCategory).length === 0 && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Modules Available</h3>
              <p className="text-muted-foreground">
                No modules are currently available for your organization.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}