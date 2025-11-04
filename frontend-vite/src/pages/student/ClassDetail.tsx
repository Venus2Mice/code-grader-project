import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, BookOpen } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { studentAPI, classAPI } from "@/services/api"
import { logger } from "@/lib/logger"

export default function StudentClassPage() {
  const { token } = useParams<{ token: string }>()
  const classToken = token as string
  const [classData, setClassData] = useState<any>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchClassData()
  }, [classToken])

  const fetchClassData = async () => {
    try {
      setIsLoading(true)
      // Fetch class details and problem status in parallel
      const [classResponse, problemsResponse] = await Promise.all([
        classAPI.getByToken(classToken),
        studentAPI.getProblemsStatus(classToken)
      ])
      setClassData(classResponse.data)
      setProblems(problemsResponse.data)
    } catch (err: any) {
      logger.error('Error fetching class data', err, { classToken })
      setError('Failed to load class data')
    } finally {
      setIsLoading(false)
    }
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

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20 border-4 border-red-500 bg-red-100 mx-auto max-w-2xl mt-10">
          <p className="font-bold text-red-700">{error || 'Class not found'}</p>
          <Button onClick={fetchClassData} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="border-b-4 border-border bg-card relative overflow-hidden">
        {/* Decorative geometric shapes */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rotate-45 border-4 border-secondary bg-secondary/20" />
        <div className="absolute -left-10 top-10 h-24 w-24 rounded-full border-4 border-accent bg-accent/20" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <Link to="/student/dashboard"
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-muted px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">{classData.name}</h1>
              <span className="border-4 border-border bg-primary px-4 py-2 font-bold uppercase text-primary-foreground">
                {classData.course_code}
              </span>
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">{classData.description}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 border-l-8 border-primary bg-card p-6">
          <h2 className="text-2xl font-black uppercase text-foreground">ASSIGNMENTS</h2>
          <p className="mt-2 font-medium text-muted-foreground">
            CLICK ON AN ASSIGNMENT TO VIEW DETAILS AND SUBMIT YOUR SOLUTION
          </p>
        </div>

        <div className="grid gap-6">
          {problems.map((problemData, index) => {
            // Backend returns flat structure, adapt to expected format
            const problem = problemData.problem || {
              id: problemData.problem_id,
              title: problemData.title,
              description: problemData.description || '',
              markdown_content: problemData.markdown_content,
              difficulty: problemData.difficulty,
              time_limit: problemData.time_limit || 1000,
              memory_limit: problemData.memory_limit || 256
            }
            
            // Only create submission object if there's actual submission data
            const submission = problemData.submission || (problemData.status && problemData.status !== 'not_started' && problemData.best_score !== undefined ? {
              status: problemData.status,
              score: problemData.best_score || 0
            } : null)
            
            const attempts = problemData.attempts_count || problemData.attempts || 0

            // Safe guard: Skip if problem data is missing
            if (!problem || !problem.id) {
              logger.warn('Invalid problem data', { index, problemData })
              return null
            }

            return (
              <Link key={problem.id} to={`/student/problem/${problem.token}/detail?classToken=${classToken}`}>
                <Card className="group cursor-pointer border-4 border-border bg-card shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.3)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all p-6">
                  <div className="flex items-start justify-between gap-6 flex-wrap lg:flex-nowrap">
                    <div className="flex-1 min-w-[300px] space-y-3">
                      {/* Title only */}
                      <h3 className="text-xl font-black uppercase text-foreground group-hover:text-primary transition-colors">
                        {problem.title}
                      </h3>

                      {/* Created date */}
                      <div className="border-4 border-border bg-background px-3 py-1.5 inline-block">
                        <span className="text-xs font-black uppercase text-muted-foreground">
                          📅 {problemData.created_at ? new Date(problemData.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* View button only */}
                    <div className="flex items-start gap-3">
                      <Button 
                        size="lg"
                        className="gap-2 font-black uppercase border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        VIEW
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {problems.length === 0 && (
          <div className="flex flex-col items-center justify-center border-4 border-dashed border-border bg-muted py-20">
            <BookOpen className="mb-6 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-3 text-2xl font-black uppercase text-foreground">NO ASSIGNMENTS YET</h3>
            <p className="font-bold uppercase text-muted-foreground">YOUR TEACHER WILL ADD ASSIGNMENTS SOON</p>
          </div>
        )}
      </div>
    </div>
  )
}

