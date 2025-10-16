"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, BookOpen, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { JoinClassDialog } from "@/components/join-class-dialog"
import { Navbar } from "@/components/navbar"
import { classAPI } from "@/services/api"

export default function StudentDashboard() {
  const router = useRouter()
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([])
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [userName, setUserName] = useState("")

  // Fetch classes on mount
  useEffect(() => {
    // Get user info from localStorage
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        setUserName(userData.username || userData.email || 'Student')
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      const response = await classAPI.getAll()
      setEnrolledClasses(response.data)
    } catch (err: any) {
      console.error('Error fetching classes:', err)
      setError('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinClass = async (classCode: string) => {
    try {
      await classAPI.join(classCode)
      // Refresh classes list after joining
      await fetchClasses()
    } catch (err: any) {
      console.error('Error joining class:', err)
      alert(err.response?.data?.msg || 'Failed to join class')
    }
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Redirect to login page
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-40 right-10 w-24 h-24 border-4 border-border bg-accent rotate-12" />
      <div className="absolute bottom-20 left-10 w-32 h-32 border-4 border-border bg-secondary rounded-full" />

      <Navbar userName={userName} userRole="student" onLogout={handleLogout} />

      <div className="border-b-4 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase text-secondary-foreground">My Classes</h1>
              <p className="mt-2 text-base font-bold text-secondary-foreground/80">View your enrolled courses</p>
            </div>
            <Button onClick={() => setIsJoinDialogOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Join Class
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 relative z-10">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
            <p className="mt-4 font-bold">Loading classes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-4 border-red-500 bg-red-100">
            <p className="font-bold text-red-700">{error}</p>
            <Button onClick={fetchClasses} className="mt-4">Retry</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {enrolledClasses.map((classItem) => (
                <Link key={classItem.id} href={`/student/class/${classItem.id}`}>
                  <Card className="group cursor-pointer p-6 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center border-4 border-border bg-primary">
                        <BookOpen className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <span className="border-4 border-border bg-muted px-3 py-1 text-xs font-black uppercase">
                        {classItem.code}
                      </span>
                    </div>

                    <h3 className="mb-3 text-2xl font-black uppercase group-hover:text-primary">{classItem.name}</h3>

                    <p className="mb-6 line-clamp-2 text-sm font-bold text-muted-foreground">{classItem.description}</p>

                    <div className="flex items-center gap-4 text-sm font-bold">
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span>{classItem.problems_done || 0} Done</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Clock className="h-5 w-5" />
                        <span>{classItem.problems_todo || 0} Todo</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {enrolledClasses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-4 border-border bg-card">
                <BookOpen className="mb-6 h-20 w-20" />
                <h3 className="mb-3 text-2xl font-black uppercase">No Classes Yet</h3>
                <p className="mb-8 font-bold text-muted-foreground">Join your first class to get started</p>
                <Button onClick={() => setIsJoinDialogOpen(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Join Class
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <JoinClassDialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen} onJoinClass={handleJoinClass} />
    </div>
  )
}
