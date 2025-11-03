import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Code2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  MarkdownDisplay,
  ExpandableDescription,
  ResourceUpload,
  ResourceDisplay,
  ErrorModal,
} from '@/components/problem'
import { problemAPI, resourceAPI } from '@/services/api'
import { logger } from '@/lib/logger'
import type { Problem, Resource } from '@/types'

export default function StudentProblemDetailPage() {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const classToken = searchParams.get('classToken')
  const problemToken = token as string

  // State
  const [problem, setProblem] = useState<Problem | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, title: '', message: '' })

  useEffect(() => {
    fetchProblemData()
  }, [problemToken])

  const fetchProblemData = async () => {
    try {
      setIsLoading(true)
      const problemResponse = await problemAPI.getByToken(problemToken)
      setProblem(problemResponse.data.data || problemResponse.data)
      
      // Try to fetch resources, but don't fail if endpoint doesn't exist
      try {
        const resourcesResponse = await resourceAPI.getByProblem(problemToken)
        setResources(resourcesResponse.data.data || [])
      } catch (resourceErr: any) {
        // If resources endpoint returns 404, just set empty array
        if (resourceErr.response?.status === 404) {
          logger.warn('Resources endpoint not implemented yet')
          setResources([])
        } else {
          throw resourceErr
        }
      }
    } catch (err: any) {
      logger.error('Failed to fetch problem data', err)
      setError('Failed to load problem details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResourceUploaded = (newResource: Resource) => {
    setResources([...resources, newResource])
    setShowUpload(false)
  }

  const handleResourceDeleted = (resourceId: number) => {
    setResources(resources.filter(r => r.id !== resourceId))
  }

  const openErrorModal = (title: string, message: string) => {
    setErrorModal({ isOpen: true, title, message })
  }

  const closeErrorModal = () => {
    setErrorModal({ ...errorModal, isOpen: false })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          <p className="ml-4 font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="border-4 border-red-500 bg-red-100 p-6 mx-auto max-w-4xl mt-10">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-700">{error || 'Problem not found'}</p>
              <Button onClick={fetchProblemData} className="mt-4">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const backLink = classToken ? `/student/class/${classToken}` : '/student/dashboard'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header Section */}
      <div className="border-b-4 border-border bg-card relative overflow-hidden">
        {/* Decorative geometric shapes */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rotate-45 border-4 border-secondary bg-secondary/20" />
        <div className="absolute -left-10 top-10 h-24 w-24 rounded-full border-4 border-accent bg-accent/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link
            to={backLink}
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-muted px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
                {problem.title}
              </h1>
              <span
                className={`border-4 border-black px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                  problem.difficulty === 'easy'
                    ? 'bg-green-400 text-black'
                    : problem.difficulty === 'medium'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-red-400 text-black'
                }`}
              >
                {problem.difficulty}
              </span>
            </div>

            {/* Problem metadata */}
            <div className="flex gap-6 flex-wrap">
              <div className="flex items-center gap-2 border-l-4 border-primary bg-primary/10 px-4 py-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Time Limit</p>
                  <p className="font-bold text-foreground">{problem.time_limit_ms}ms</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l-4 border-accent bg-accent/10 px-4 py-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Memory Limit</p>
                  <p className="font-bold text-foreground">{problem.memory_limit_kb}KB</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l-4 border-secondary bg-secondary/10 px-4 py-2">
                <Code2 className="h-5 w-5 text-secondary" />
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Language</p>
                  <p className="font-bold text-foreground uppercase">{problem.language}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Problem Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Problem Description */}
            <Card className="border-4 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
              <h2 className="mb-4 text-2xl font-black uppercase text-foreground">PROBLEM DESCRIPTION</h2>
              {problem.markdown_content ? (
                <MarkdownDisplay markdown={problem.markdown_content} />
              ) : (
                <ExpandableDescription description={problem.description} />
              )}
            </Card>

            {/* Function Signature */}
            {problem.function_signature && (
              <Card className="border-4 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
                <h2 className="mb-4 text-2xl font-black uppercase text-foreground">FUNCTION SIGNATURE</h2>
                <pre className="border-4 border-border bg-background p-4 font-mono text-sm overflow-x-auto">
                  <code>{problem.function_signature}</code>
                </pre>
              </Card>
            )}

            {/* Resources Section */}
            {resources.length > 0 && (
              <ResourceDisplay resources={resources} canDelete={false} />
            )}

            {/* Upload Resources */}
            {showUpload && (
              <ResourceUpload
                problemId={problemToken}
                onUploadSuccess={handleResourceUploaded}
                onError={openErrorModal}
              />
            )}

            {!showUpload && (
              <Button
                onClick={() => setShowUpload(true)}
                className="w-full border-4 border-border bg-cyan-500 px-6 py-3 font-bold uppercase text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                + ADD RESOURCES
              </Button>
            )}
          </div>

          {/* Right Column - Action Panel */}
          <div className="space-y-6">
            <Card className="border-4 border-border bg-primary text-primary-foreground p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
              <div className="mb-6">
                <h3 className="text-xl font-black uppercase mb-2">Ready to code?</h3>
                <p className="text-sm font-medium opacity-90">
                  Click the button below to open the code editor and start solving.
                </p>
              </div>

              <Link
                to={`/student/problem/${problemToken}?classToken=${classToken}`}
                className="flex items-center justify-center gap-3 border-4 border-current bg-background text-foreground px-6 py-4 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all w-full"
              >
                <Code2 className="h-5 w-5" />
                OPEN CODE EDITOR
              </Link>
            </Card>

            {/* Quick Info */}
            <Card className="border-4 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
              <h3 className="mb-4 text-lg font-black uppercase text-foreground">QUICK INFO</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 px-3 py-2">
                  <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">Test Cases</p>
                  <p className="font-bold text-foreground">{problem.test_cases?.length || 0} test cases</p>
                </div>
                <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950 px-3 py-2">
                  <p className="text-xs font-bold uppercase text-purple-700 dark:text-purple-300">Resources</p>
                  <p className="font-bold text-foreground">{resources.length} attached</p>
                </div>
              </div>
            </Card>

            {/* Tips Section */}
            <Card className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]">
              <h3 className="mb-3 text-lg font-black uppercase text-yellow-700 dark:text-yellow-300">TIPS</h3>
              <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-200">
                <li>✓ Read the problem carefully</li>
                <li>✓ Check the function signature</li>
                <li>✓ Review attached resources</li>
                <li>✓ Test with sample inputs first</li>
                <li>✓ Submit when ready</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal.isOpen && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          title={errorModal.title}
          message={errorModal.message}
          onClose={closeErrorModal}
        />
      )}
    </div>
  )
}
