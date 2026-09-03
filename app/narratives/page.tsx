'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

interface Narrative {
  id: string
  date: string
  content: string
  isDraft: boolean
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function NarrativesPage() {
  const router = useRouter()
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted'>('all')

  useEffect(() => {
    fetchNarratives()
  }, [])

  const fetchNarratives = async () => {
    try {
      const response = await fetch('/api/narratives')
      if (response.ok) {
        const data = await response.json()
        setNarratives(data.narratives || [])
      }
    } catch (error) {
      console.error('Error fetching narratives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityTitle = (content: string) => {
    const activityMatch = content.match(/\*\*Activity:\*\*\s*(.+)/i)
    return activityMatch ? activityMatch[1] : 'Daily Activity'
  }

  const filteredNarratives = narratives.filter(n => {
    if (filter === 'draft') return n.isDraft
    if (filter === 'submitted') return !n.isDraft
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading narratives...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Narratives</h1>
                  <p className="text-sm text-gray-600 mt-1">{narratives.length} total submissions</p>
                </div>
              </div>
            </div>
            <Button onClick={() => router.push('/narratives/create')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Narrative
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            All ({narratives.length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'submitted'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Submitted ({narratives.filter(n => !n.isDraft).length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'draft'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            Drafts ({narratives.filter(n => n.isDraft).length})
          </button>
        </div>

        {/* Narratives List */}
        {filteredNarratives.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No narratives yet</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'draft'
                  ? "You don't have any draft narratives"
                  : filter === 'submitted'
                  ? "You haven't submitted any narratives yet"
                  : 'Start documenting your work immersion experience'}
              </p>
              <Button onClick={() => router.push('/narratives/create')}>
                Create Your First Narrative
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNarratives.map((narrative) => (
              <Card key={narrative.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getActivityTitle(narrative.content)}
                        </h3>
                        {narrative.isDraft ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Draft
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Submitted
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {format(new Date(narrative.date), 'MMM dd, yyyy')}
                          </span>
                        </div>

                        {narrative.submittedAt && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              Submitted: {format(new Date(narrative.submittedAt), 'MMM dd, yyyy h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 line-clamp-2">
                        {narrative.content.replace(/\*\*/g, '').substring(0, 200)}...
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/narratives/${narrative.id}`)}
                      >
                        View
                      </Button>
                      {narrative.isDraft && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/narratives/${narrative.id}/edit`)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
