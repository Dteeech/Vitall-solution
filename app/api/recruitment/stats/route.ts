import { NextResponse } from 'next/server'
import { RecruitmentService } from '@/lib/services/recruitment'
import { requireModule } from '@/lib/auth'

export async function GET() {
  try {
    await requireModule('recruitment')

    const stats = await RecruitmentService.getCandidateStats()

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Error fetching recruitment stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recruitment stats' },
      { status: 500 }
    )
  }
}