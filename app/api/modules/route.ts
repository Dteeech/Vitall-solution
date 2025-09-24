import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { toggleModule, getModulesWithStatus } from '@/lib/module-registry'
import { z } from 'zod'

const toggleModuleSchema = z.object({
  moduleName: z.string().min(1),
  enabled: z.boolean()
})

export async function GET() {
  try {
    const modules = await getModulesWithStatus()
    return NextResponse.json({ modules })
  } catch (error: any) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !['admin', 'owner'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { moduleName, enabled } = toggleModuleSchema.parse(body)

    const result = await toggleModule(moduleName, enabled)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle module' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Module ${enabled ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error: any) {
    console.error('Error toggling module:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}