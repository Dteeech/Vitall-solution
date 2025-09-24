'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface ModuleToggleProps {
  moduleName: string
  enabled: boolean
}

export function ModuleToggle({ moduleName, enabled }: ModuleToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async (newEnabled: boolean) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleName,
          enabled: newEnabled
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle module')
      }

      setIsEnabled(newEnabled)
      toast({
        title: 'Success',
        description: data.message || `Module ${newEnabled ? 'enabled' : 'disabled'} successfully`,
      })

      // Refresh the page to update navigation
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('Error toggling module:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle module',
        variant: 'destructive'
      })
      // Revert the switch state
      setIsEnabled(isEnabled)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Switch
      checked={isEnabled}
      onCheckedChange={handleToggle}
      disabled={isLoading}
      aria-label={`Toggle ${moduleName} module`}
    />
  )
}