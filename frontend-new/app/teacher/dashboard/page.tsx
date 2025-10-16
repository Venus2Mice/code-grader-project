"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Users, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateClassDialog } from "@/components/create-class-dialog"
import { Navbar } from "@/components/navbar"
import { classAPI } from "@/services/api"

export default function TeacherDashboard() {
  const router = useRouter()
  const [classes, setClasses] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // Get user info from localStorage
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        setUserName(userData.username || userData.email || 'Teacher')
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
      setClasses(response.data)
    } catch (err: any) {
      console.error('Error fetching classes:', err)
      setError('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClass = async (newClass: any) => {
    try {
      await classAPI.create({
        name: newClass.name,
        course_code: newClass.code,
        description: newClass.description || ''
      })
      // Refresh classes list
      await fetchClasses()
    } catch (err: any) {
      console.error('Error creating class:', err)
      alert(err.response?.data?.msg || 'Failed to create class')
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
    <div className="min-h-screen bg-background">
      <Navbar userName={userName} userRole="teacher" onLogout={handleLogout} />

      <div className="border-b-4 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase text-secondary-foreground">My Classes</h1>
              <p className="mt-2 font-bold text-secondary-foreground/80">Manage your courses and assignments</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-5 w-5" />
              Create Class
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
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
              {classes.map((classItem) => (
                <Link key={classItem.id} href={`/teacher/class/${classItem.id}`}>
                  <Card className="group cursor-pointer p-6 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center bg-primary border-4 border-border">
                        <BookOpen className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <span className="border-4 border-border bg-muted px-4 py-2 text-xs font-black uppercase">
                        {classItem.course_code}
                      </span>
                    </div>

                    <h3 className="mb-3 text-2xl font-black uppercase group-hover:text-primary">{classItem.name}</h3>

                    <p className="mb-6 line-clamp-2 font-medium">{classItem.description}</p>

                    <div className="flex items-center gap-6 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span>{classItem.student_count || 0} students</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span>{classItem.created_at ? new Date(classItem.created_at).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {classes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-4 border-border bg-card">
                <BookOpen className="mb-6 h-20 w-20" />
                <h3 className="mb-3 text-2xl font-black uppercase">No classes yet</h3>
                <p className="mb-8 font-bold">Create your first class to get started</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Class
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateClassDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateClass={handleCreateClass}
      />
    </div>
  )
}
