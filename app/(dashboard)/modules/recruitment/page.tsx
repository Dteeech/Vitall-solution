import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { requireModule } from '@/lib/auth'
import { RecruitmentService } from '@/lib/services/recruitment'
import { Plus, Mail, Phone, ExternalLink, Star } from 'lucide-react'
import Link from 'next/link'

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'interview':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'hired':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export default async function RecruitmentPage() {
  await requireModule('recruitment')

  const [candidates, stats] = await Promise.all([
    RecruitmentService.getCandidates({ limit: 10 }),
    RecruitmentService.getCandidateStats()
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">
            Manage candidates and track your hiring process
          </p>
        </div>
        <Button asChild>
          <Link href="/modules/recruitment/candidates/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time candidates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting evaluation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.interview}</div>
            <p className="text-xs text-muted-foreground">
              Currently interviewing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.hired}</div>
            <p className="text-xs text-muted-foreground">
              Successfully hired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Candidates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Candidates</CardTitle>
              <CardDescription>
                Latest candidate applications and updates
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/modules/recruitment/candidates">
                View All
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No candidates yet</p>
              <Button asChild>
                <Link href="/modules/recruitment/candidates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Candidate
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{candidate.name}</div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {candidate.email}
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {candidate.phone}
                          </div>
                        )}
                        {candidate.linkedin_url && (
                          <div className="flex items-center">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            LinkedIn
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {candidate.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {candidate.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{candidate.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Star className={`h-4 w-4 ${getScoreColor(candidate.score)}`} />
                      <span className={`text-sm font-medium ${getScoreColor(candidate.score)}`}>
                        {candidate.score}
                      </span>
                    </div>
                    
                    <Badge className={getStatusColor(candidate.status)}>
                      {candidate.status}
                    </Badge>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/modules/recruitment/candidates/${candidate.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}