'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Package,
  Calculator,
  Settings,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface NavigationItem {
  name: string
  href: string
  icon: string
  children?: { name: string; href: string }[]
}

interface AppShellProps {
  children: React.ReactNode
  navigation: NavigationItem[]
  user: {
    fullName?: string
    email: string
    role: string
  }
}

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Package,
  Calculator,
  Settings,
  Menu,
  X,
  LogOut,
  User
}

export function AppShell({ children, navigation, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  const renderIcon = (iconName: string, className?: string) => {
    const Icon = iconMap[iconName] || Package
    return <Icon className={className} />
  }

  return (
    <div className="h-full">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
          <SidebarContent
            navigation={navigation}
            pathname={pathname}
            onClose={() => setSidebarOpen(false)}
            renderIcon={renderIcon}
            user={user}
            onSignOut={handleSignOut}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:block lg:bg-white lg:shadow-sm lg:border-r">
        <SidebarContent
          navigation={navigation}
          pathname={pathname}
          renderIcon={renderIcon}
          user={user}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {user.fullName || user.email}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: NavigationItem[]
  pathname: string
  onClose?: () => void
  renderIcon: (iconName: string, className?: string) => React.ReactNode
  user: { fullName?: string; email: string; role: string }
  onSignOut: () => void
}

function SidebarContent({ 
  navigation, 
  pathname, 
  onClose, 
  renderIcon, 
  user, 
  onSignOut 
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">ModularSaaS</span>
        </Link>
        
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item) => (
          <div key={item.name}>
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {renderIcon(item.icon, "mr-3 h-5 w-5")}
              {item.name}
            </Link>
            
            {item.children && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      "block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900",
                      pathname === child.href && "bg-gray-50 text-gray-900"
                    )}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user.fullName || user.email}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {user.role}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}