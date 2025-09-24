'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEnabledModules, getModuleStats } from '@/lib/module-registry'
import { OrganizationService } from '@/lib/services/core'
import { RecruitmentService } from '@/lib/services/recruitment'
import { GEDService } from '@/lib/services/ged'
import { TimesheetService } from '@/lib/services/timesheets'
import { InventoryService } from '@/lib/services/inventory'
import { AccountingService } from '@/lib/services/accounting'
import { isModuleEnabled } from '@/lib/auth'
import { 
  Users, 
  FileText, 
  Clock, 
  Package, 
  Calculator,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: string
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-600 ml-1">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const enabledModules = await getEnabledModules()
  const moduleStats = await getModuleStats()
  const orgStats = await OrganizationService.getOrganizationStats()

  // Gather module-specific stats
  const moduleData = await Promise.all([
    isModuleEnabled('recruitment').then(async (enabled) => {
      if (!enabled) return null
      try {
        return await RecruitmentService.getCandidateStats()
      } catch {
        return null
      }
    }),
    isModuleEnabled('ged').then(async (enabled) => {
      if (!enabled) return null
      try {
        return await GEDService.getDocumentStats()
      } catch {
        return null
      }
    }),
    isModuleEnabled('timesheets').then(async (enabled) => {
      if (!enabled) return null
      try {
        return await TimesheetService.getTimesheetStats()
      } catch {
        return null
      }
    }),
    isModuleEnabled('inventory').then(async (enabled) => {
      if (!enabled) return null
      try {
        return await InventoryService.getInventoryStats()
      } catch {
        return null
      }
    }),
    isModuleEnabled('accounting').then(async (enabled) => {
      if (!enabled) return null
      try {
        return await AccountingService.getAccountingStats()
      } catch {
        return null
      }
    })
  ])

  const [recruitmentStats, gedStats, timesheetStats, inventoryStats, accountingStats] = moduleData

  const alerts = []
  
  // Add low stock alert
  if (inventoryStats && inventoryStats.lowStockItems > 0) {
    alerts.push({
      type: 'warning',
      message: `${inventoryStats.lowStockItems} items are low in stock`,
      module: 'Inventory'
    })
  }
  
  // Add overdue invoices alert  
  if (accountingStats && accountingStats.overdueInvoices > 0) {
    alerts.push({
      type: 'error',
      message: `${accountingStats.overdueInvoices} invoices are overdue`,
      module: 'Accounting'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your organization.
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`flex items-center p-3 rounded-lg border ${
              alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
              'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}>
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">
                <strong>{alert.module}:</strong> {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Users"
          value={orgStats.activeUsers}
          description="Total active users in organization"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Enabled Modules"
          value={moduleStats.enabled}
          description={`of ${moduleStats.total} available`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Recent Activity"
          value={orgStats.recentAuditEntries}
          description="Actions in the last 30 days"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="System Health"
          value="98.5%"
          description="Average uptime this month"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          trend="+2.1%"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enabled Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Active Modules</CardTitle>
            <CardDescription>
              Modules currently enabled for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enabledModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No modules enabled</p>
            ) : (
              enabledModules.map(({ module }) => (
                <div key={module.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {module.name === 'recruitment' && <Users className="h-4 w-4 text-blue-600" />}
                      {module.name === 'ged' && <FileText className="h-4 w-4 text-blue-600" />}
                      {module.name === 'timesheets' && <Clock className="h-4 w-4 text-blue-600" />}
                      {module.name === 'inventory' && <Package className="h-4 w-4 text-blue-600" />}
                      {module.name === 'accounting' && <Calculator className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <div className="font-medium">{module.title}</div>
                      <div className="text-sm text-muted-foreground">{module.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Module Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Module Overview</CardTitle>
            <CardDescription>
              Quick stats from your active modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recruitmentStats && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Recruitment</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {recruitmentStats.total} candidates
                  {recruitmentStats.recentCount > 0 && (
                    <span className="text-green-600 ml-1">
                      (+{recruitmentStats.recentCount} this week)
                    </span>
                  )}
                </div>
              </div>
            )}

            {gedStats && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Documents</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {gedStats.totalDocuments} files
                  {gedStats.recentDocuments > 0 && (
                    <span className="text-green-600 ml-1">
                      (+{gedStats.recentDocuments} this week)
                    </span>
                  )}
                </div>
              </div>
            )}

            {timesheetStats && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Timesheets</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {timesheetStats.currentMonth.totalHours.toFixed(1)}h this month
                </div>
              </div>
            )}

            {inventoryStats && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Inventory</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {inventoryStats.activeItems} active items
                  {inventoryStats.lowStockItems > 0 && (
                    <span className="text-red-600 ml-1">
                      ({inventoryStats.lowStockItems} low stock)
                    </span>
                  )}
                </div>
              </div>
            )}

            {accountingStats && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium">Accounting</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {AccountingService.formatCurrency(accountingStats.totalRevenue)} revenue
                  {accountingStats.overdueInvoices > 0 && (
                    <span className="text-red-600 ml-1">
                      ({accountingStats.overdueInvoices} overdue)
                    </span>
                  )}
                </div>
              </div>
            )}

            {!recruitmentStats && !gedStats && !timesheetStats && !inventoryStats && !accountingStats && (
              <p className="text-sm text-muted-foreground py-4">
                Enable modules to see statistics here
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}