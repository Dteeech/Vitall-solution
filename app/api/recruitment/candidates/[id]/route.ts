import { NextRequest, NextResponse } from 'next/server'
import { RecruitmentService } from '@/lib/services/recruitment'
import { requireModule } from '@/lib/auth'
import { z } from 'zod'

const updateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  cvUrl: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['pending', 'interview', 'hired', 'rejected']).optional(),
  score: z.number().int().min(0).max(100).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireModule('recruitment')

    const candidate = await RecruitmentService.getCandidate(params.id)

    return NextResponse.json({ candidate })
  } catch (error: any) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidate' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireModule('recruitment')

    const body = await request.json()
    const updates = updateCandidateSchema.parse(body)

    const candidate = await RecruitmentService.updateCandidate(params.id, updates)

    return NextResponse.json({ 
      candidate,
      message: 'Candidate updated successfully' 
    })
  } catch (error: any) {
    console.error('Error updating candidate:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update candidate' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireModule('recruitment')

    await RecruitmentService.deleteCandidate(params.id)

    return NextResponse.json({ 
      message: 'Candidate deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete candidate' },
      { status: 500 }
    )
  }
}