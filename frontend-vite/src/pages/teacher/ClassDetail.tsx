import { useParams, Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Users, BookOpen, Settings, Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { classAPI, problemAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import { ExpandableDescription } from "@/components/problem"

export default function ClassDetailPage() {
  const params = useParams()
  const classId = params.id as string
  const [classData, setClassData] = useState<any>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [classId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Fetch class details, problems, and students in parallel
      const [classResponse, studentsResponse] = await Promise.all([
        classAPI.getById(Number(classId)),
        classAPI.getStudents(Number(classId))
      ])
      
      setClassData(classResponse.data)
      setStudents(studentsResponse.data)
      
      // Problems are nested in class data
      setProblems(classResponse.data.problems || [])
    } catch (err: any) {
      logger.error('Error fetching class data', err, { classId })
      setError('Failed to load class data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(classData.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logger.error('Failed to copy invite code', err)
      alert('Failed to copy invite code')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brutal-bg">
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
          <p className="ml-4 font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-brutal-bg">
        <div className="text-center py-20 border-4 border-red-500 bg-red-100 mx-auto max-w-2xl mt-10">
          <p className="font-bold text-red-700">{error || 'Class not found'}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brutal-bg relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="hidden lg:block absolute top-20 right-20 w-28 h-28 border-4 border-black bg-brutal-yellow rotate-45" />
      <div className="hidden lg:block absolute bottom-40 left-20 w-36 h-36 border-4 border-black bg-brutal-pink" />

      <div className="border-b-4 border-black bg-background relative z-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6">
          <Link
            to="/teacher/dashboard"
            className="mb-6 inline-flex items-center gap-2 border-4 border-border bg-muted px-4 py-2 font-bold uppercase tracking-wide text-foreground transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-2xl md:text-4xl font-black uppercase text-foreground">{classData.name}</h1>
                <span className="border-4 border-black bg-brutal-accent px-3 md:px-4 py-2 text-xs md:text-sm font-black uppercase text-black w-fit">
                  {classData.course_code}
                </span>
              </div>
              <p className="mt-3 font-bold text-sm md:text-base text-foreground">{classData.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 relative z-10">
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList className="w-full grid grid-cols-3 gap-1">
            <TabsTrigger value="assignments" className="gap-1 md:gap-2 font-black uppercase text-xs md:text-sm">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">ASSIGNMENTS</span>
              <span className="sm:hidden">ASSIGN</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1 md:gap-2 font-black uppercase text-xs md:text-sm">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">STUDENTS</span>
              <span className="sm:hidden">STUD</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 md:gap-2 font-black uppercase text-xs md:text-sm">
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">SETTINGS</span>
              <span className="sm:hidden">SET</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-black uppercase">ASSIGNMENTS</h2>
              <Link to={`/teacher/class/${classId}/create-problem`}>
                <Button className="gap-2 font-black uppercase text-xs md:text-sm w-full sm:w-auto">
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  CREATE
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {problems.map((problem) => (
                <Card key={problem.id} className="border-4 border-border bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Title and badges */}
                      <div className="flex items-start gap-3 flex-wrap">
                        <h3 className="text-lg md:text-xl font-black uppercase text-foreground tracking-tight">{problem.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`border-4 border-black px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                              problem.difficulty === "easy"
                                ? "bg-green-400"
                                : problem.difficulty === "medium"
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                          <span className="border-4 border-black bg-blue-400 px-3 py-1 text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            {problem.grading_mode || 'FUNCTION'}
                          </span>
                        </div>
                      </div>

                      {/* Description with expand/collapse */}
                      <ExpandableDescription
                        description={problem.description}
                        markdownContent={problem.markdown_content}
                        maxLines={2}
                      />

                      {/* Metadata tags */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="border-4 border-border bg-background px-3 py-1.5">
                          <span className="text-xs font-black uppercase text-foreground">
                            ⏱️ TIME: {problem.time_limit_ms || problem.time_limit || 0}MS
                          </span>
                        </div>
                        <div className="border-4 border-border bg-background px-3 py-1.5">
                          <span className="text-xs font-black uppercase text-foreground">
                            💾 MEM: {Math.round((problem.memory_limit_kb || problem.memory_limit || 0) / 1024)}MB
                          </span>
                        </div>
                        <div className="hidden sm:block border-4 border-border bg-background px-3 py-1.5">
                          <span className="text-xs font-black uppercase text-muted-foreground">
                            📅 {problem.created_at ? new Date(problem.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* View button */}
                    <Link to={`/teacher/problem/${problem.id}`} className="lg:self-start">
                      <Button
                        size="lg"
                        className="font-black uppercase text-sm w-full lg:w-auto border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        VIEW DETAILS →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}

              {problems.length === 0 && (
                <div className="flex flex-col items-center justify-center border-4 border-dashed border-border bg-muted py-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
                  <div className="border-4 border-border bg-background p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                    <BookOpen className="h-20 w-20 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-2xl font-black uppercase text-foreground">NO ASSIGNMENTS YET</h3>
                  <p className="mb-6 text-sm font-bold text-muted-foreground uppercase">CREATE YOUR FIRST ASSIGNMENT TO GET STARTED</p>
                  <Link to={`/teacher/class/${classId}/create-problem`}>
                    <Button className="gap-2 font-black uppercase border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                      <Plus className="h-5 w-5" />
                      CREATE ASSIGNMENT
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-black uppercase">STUDENTS ({students.length})</h2>
              <Button
                variant="outline"
                className="gap-2 font-black uppercase bg-transparent text-xs md:text-sm w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                ADD
              </Button>
            </div>

            <Card>
              <div className="divide-y-4 divide-black">
                {students.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center border-4 border-black bg-brutal-accent text-xs md:text-sm font-black uppercase">
                        {student.full_name
                          ? student.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                          : "?"}
                      </div>
                      <div>
                        <p className="font-black uppercase text-xs md:text-sm text-foreground">{student.full_name || 'Unknown'}</p>
                        <p className="text-xs font-bold text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground">
                      ENROLLED: {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-6 text-2xl font-black uppercase text-foreground">CLASS SETTINGS</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-black uppercase mb-3">INVITE CODE</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="border-4 border-black bg-primary px-6 py-3">
                      <p className="text-2xl font-black text-primary-foreground tracking-wider">
                        {classData.invite_code || 'N/A'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsShareModalOpen(true)}
                      className="gap-2 font-black uppercase"
                    >
                      <Share2 className="h-4 w-4" />
                      SHARE CODE
                    </Button>
                  </div>
                  <p className="mt-3 text-xs font-bold text-muted-foreground">
                    Students use this code to join your class
                  </p>
                </div>

                <div className="border-t-4 border-border pt-6">
                  <p className="text-sm font-black uppercase mb-2">CLASS CODE</p>
                  <p className="text-sm font-bold">
                    <span className="border-4 border-black bg-brutal-accent px-3 py-1 font-black">
                      {classData.course_code}
                    </span>
                  </p>
                </div>

                <div className="border-t-4 border-border pt-6">
                  <p className="text-sm font-black uppercase mb-2">CREATED</p>
                  <p className="text-sm font-bold">
                    {classData.created_at ? new Date(classData.created_at).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Invite Code Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md border-4 border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full p-3 bg-primary/10">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl font-black uppercase">
                SHARE INVITE CODE
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-3">
              Share this code with your students so they can join the class
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="border-4 border-border bg-primary/5 p-6 text-center">
              <p className="text-xs font-black uppercase text-muted-foreground mb-2">INVITE CODE</p>
              <p className="text-4xl font-black text-primary tracking-widest">
                {classData.invite_code}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCopyInviteCode}
                className="flex-1 gap-2 font-black uppercase"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    COPY CODE
                  </>
                )}
              </Button>
            </div>

            <div className="border-4 border-border bg-muted p-4">
              <p className="text-xs font-black uppercase text-foreground mb-2">📌 INSTRUCTIONS FOR STUDENTS:</p>
              <ol className="text-xs font-bold text-foreground space-y-1 list-decimal list-inside">
                <li>Go to Student Dashboard</li>
                <li>Click "Join Class" button</li>
                <li>Enter the invite code: <span className="bg-primary/20 px-2 py-0.5 font-black">{classData.invite_code}</span></li>
                <li>Start solving problems!</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
