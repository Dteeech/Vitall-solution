import { NextRequest, NextResponse } from 'next/server'
import { RecruitmentService } from '@/lib/services/recruitment'
import { requireModule } from '@/lib/auth'
import { z } from 'zod'

const createCandidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  cvUrl: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const getCandidatesSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
})

export async function GET(request: NextRequest) {
  try {
    await requireModule('recruitment')

    const { searchParams } = new URL(request.url)
    const filters = getCandidatesSchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    })

    const candidates = await RecruitmentService.getCandidates(filters)

    return NextResponse.json({ candidates })
  } catch (error: any) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireModule('recruitment')

    const body = await request.json()
    const candidateData = createCandidateSchema.parse(body)

    const candidate = await RecruitmentService.createCandidate(candidateData)

    return NextResponse.json({ 
      candidate,
      message: 'Candidate created successfully' 
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating candidate:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create candidate' },
      { status: 500 }
    )
  }
}