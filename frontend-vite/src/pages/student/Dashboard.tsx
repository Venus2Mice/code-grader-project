import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { Plus, BookOpen, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { JoinClassDialog } from "@/components/join-class-dialog"
import { Navbar } from "@/components/navbar"
import { classAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import { useTranslation } from "react-i18next"
import { useLanguageSync } from "@/hooks/useLanguageSync"

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation(['student', 'common'])
  useLanguageSync() // Sync language on mount
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
        logger.error('Error parsing user data', e)
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
      logger.error('Error fetching classes', err)
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
      logger.error('Error joining class', err, { classCode })
      alert(err.response?.data?.msg || 'Failed to join class')
    }
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('logout'))
    
    // Redirect to login page
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative geometric shapes - Student themed */}
      <div className="absolute top-20 right-20 w-32 h-32 border-4 border-primary bg-primary/10 rotate-12 animate-pulse" />
      <div className="absolute top-60 right-40 w-20 h-20 border-4 border-accent bg-accent/10 rounded-full" />
      <div className="absolute bottom-20 left-10 w-40 h-40 border-4 border-secondary bg-secondary/10 -rotate-12" />
      <div className="absolute bottom-40 left-40 w-24 h-24 border-4 border-card bg-card/10 rounded-full animate-pulse" />

      <Navbar userName={userName} userRole="student" onLogout={handleLogout} />

      {/* Header with gradient and pattern - Different from teacher */}
      <div className="border-b-4 border-border bg-primary dark:bg-primary-foreground/5 relative overflow-hidden">
        {/* Animated pattern background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzNmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiBvcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="mx-auto max-w-7xl px-6 py-10 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-black uppercase text-white tracking-tight drop-shadow-lg">
                {t('student:dashboard.myClasses')}
              </h1>
              <p className="mt-3 text-lg font-bold text-white/90">
                {t('student:dashboard.welcomeMessage', { name: userName })}
              </p>
            </div>
            <Button 
              onClick={() => setIsJoinDialogOpen(true)} 
              size="lg"
              className="gap-2 bg-white text-blue-600 hover:bg-white/90 border-4 border-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] transition-all"
            >
              <Plus className="h-5 w-5" />
              {t('student:dashboard.joinClass')}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 relative z-10">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
            <p className="mt-4 font-bold text-blue-600 dark:text-blue-400">{t('common:loading')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-4 border-red-500 bg-red-100 dark:bg-red-900/20">
            <p className="font-bold text-red-700 dark:text-red-400">{error}</p>
            <Button onClick={fetchClasses} className="mt-4">{t('common:retry')}</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {enrolledClasses.map((classItem) => (
                <Link key={classItem.id} to={`/student/class/${classItem.token}`}>
                  <Card className="group cursor-pointer p-6 transition-all hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.5)] dark:hover:shadow-[8px_8px_0px_0px_rgba(59,130,246,0.3)] border-4 border-border bg-white dark:bg-gray-900">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center border-4 border-border bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <BookOpen className="h-7 w-7 text-white" />
                      </div>
                      <span className="border-4 border-border bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 px-3 py-1 text-xs font-black uppercase text-blue-700 dark:text-blue-300">
                        {classItem.code}
                      </span>
                    </div>

                    <h3 className="mb-3 text-2xl font-black uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {classItem.name}
                    </h3>

                    <p className="mb-6 line-clamp-2 text-sm font-bold text-muted-foreground">
                      {classItem.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm font-bold">
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span>{classItem.problems_done || 0} {t('student:dashboard.done')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <Clock className="h-5 w-5" />
                        <span>{classItem.problems_todo || 0} {t('student:dashboard.todo')}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {enrolledClasses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                <div className="h-24 w-24 border-4 border-blue-500 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 rotate-12 shadow-lg">
                  <BookOpen className="h-12 w-12 text-white -rotate-12" />
                </div>
                <h3 className="mb-3 text-3xl font-black uppercase text-blue-700 dark:text-blue-400">{t('student:dashboard.noClasses')}</h3>
                <p className="mb-8 font-bold text-blue-600 dark:text-blue-500 text-lg">{t('student:dashboard.joinFirstClass')}</p>
                <Button 
                  onClick={() => setIsJoinDialogOpen(true)} 
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-4 border-border font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Plus className="h-5 w-5" />
                  {t('student:dashboard.joinClass')}
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

