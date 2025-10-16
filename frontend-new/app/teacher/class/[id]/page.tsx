"use client"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Users, BookOpen, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { classAPI, problemAPI } from "@/services/api"

export default function ClassDetailPage() {
  const params = useParams()
  const classId = params.id as string
  const [classData, setClassData] = useState<any>(null)
  const [problems, setProblems] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

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
      console.error('Error fetching class data:', err)
      setError('Failed to load class data')
    } finally {
      setIsLoading(false)
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
            href="/teacher/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-xs md:text-sm font-black uppercase hover:text-brutal-accent"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
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
              <Link href={`/teacher/class/${classId}/create-problem`}>
                <Button className="gap-2 font-black uppercase text-xs md:text-sm w-full sm:w-auto">
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  CREATE
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {problems.map((problem) => (
                <Card key={problem.id} className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h3 className="text-base md:text-xl font-black uppercase text-foreground">{problem.title}</h3>
                        <span
                          className={`border-4 border-black px-2 md:px-3 py-1 text-xs font-black uppercase ${
                            problem.difficulty === "easy"
                              ? "bg-green-400"
                              : problem.difficulty === "medium"
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                        <span className="border-4 border-black bg-background px-2 md:px-3 py-1 text-xs font-black uppercase text-foreground">
                          {problem.grading_mode}
                        </span>
                      </div>
                      <p className="mt-3 text-xs md:text-sm font-bold text-foreground line-clamp-2">
                        {problem.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 md:gap-4 text-xs font-bold text-muted-foreground">
                        <span>TIME: {problem.time_limit_ms || problem.time_limit || 0}MS</span>
                        <span>MEM: {Math.round((problem.memory_limit_kb || problem.memory_limit || 0) / 1024)}MB</span>
                        <span className="hidden sm:inline">CREATED: {problem.created_at ? new Date(problem.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <Link href={`/teacher/problem/${problem.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-black uppercase bg-transparent text-xs md:text-sm w-full md:w-auto"
                      >
                        VIEW
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}

              {problems.length === 0 && (
                <div className="flex flex-col items-center justify-center border-4 border-dashed border-black bg-background py-16">
                  <BookOpen className="mb-4 h-16 w-16 text-foreground" />
                  <h3 className="mb-2 text-xl font-black uppercase text-foreground">NO ASSIGNMENTS</h3>
                  <p className="mb-4 text-sm font-bold text-muted-foreground">CREATE YOUR FIRST ASSIGNMENT</p>
                  <Link href={`/teacher/class/${classId}/create-problem`}>
                    <Button className="gap-2 font-black uppercase">
                      <Plus className="h-5 w-5" />
                      CREATE
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
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-black uppercase">CLASS CODE</p>
                  <p className="mt-2 text-sm font-bold">
                    STUDENTS USE THIS CODE:{" "}
                    <span className="border-4 border-black bg-brutal-accent px-3 py-1 font-black">
                      {classData.course_code}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-black uppercase">CREATED</p>
                  <p className="mt-2 text-sm font-bold">{new Date(classData.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
