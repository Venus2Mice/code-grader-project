
import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { Plus, Users, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateClassDialog } from "@/components/create-class-dialog"
import { Navbar } from "@/components/navbar"
import { classAPI } from "@/services/api"
import { logger } from "@/lib/logger"
import { useTranslation } from "react-i18next"
import { useLanguageSync } from "@/hooks/useLanguageSync"

export default function TeacherDashboard() {
  const { t } = useTranslation(['teacher', 'common'])
  useLanguageSync()
  const navigate = useNavigate()
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
        logger.error('Error parsing user data', e)
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
      logger.error('Error fetching classes', err)
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
      logger.error('Error creating class', err)
      alert(err.response?.data?.msg || 'Failed to create class')
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-950">
      <Navbar userName={userName} userRole="teacher" onLogout={handleLogout} />

      <div className="border-b-4 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-400 to-amber-500 dark:from-orange-700 dark:to-amber-800">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black uppercase text-white drop-shadow-lg">{t('teacher:dashboard.myClasses')}</h1>
              <p className="mt-2 font-bold text-orange-50">{t('teacher:dashboard.manageSubtitle')}</p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              className="gap-2 bg-white text-orange-600 hover:bg-orange-50 border-3 border-orange-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] font-black"
            >
              <Plus className="h-5 w-5" />
              {t('teacher:dashboard.createClass')}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
            <p className="mt-4 font-bold">{t('common:loading')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 border-4 border-red-500 bg-red-100">
            <p className="font-bold text-red-700">{error}</p>
            <Button onClick={fetchClasses} className="mt-4">{t('common:retry')}</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => (
                <Link key={classItem.id} to={`/teacher/class/${classItem.token}`}>
                  <Card className="group cursor-pointer p-6 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0px_0px_rgba(249,115,22,0.3)] border-3 border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 hover:border-orange-400 dark:hover:border-orange-500">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center bg-gradient-to-br from-orange-400 to-amber-500 border-3 border-orange-300 dark:border-orange-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                        <BookOpen className="h-7 w-7 text-white" />
                      </div>
                      <span className="border-3 border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900 px-4 py-2 text-xs font-black uppercase text-orange-700 dark:text-orange-200">
                        {classItem.course_code}
                      </span>
                    </div>

                    <h3 className="mb-3 text-2xl font-black uppercase text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">{classItem.name}</h3>

                    <p className="mb-6 line-clamp-2 font-medium text-gray-600 dark:text-gray-300">{classItem.description}</p>

                    <div className="flex items-center gap-6 font-bold text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        <span>{classItem.student_count || 0} {t('teacher:dashboard.students')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        <span>{classItem.created_at ? new Date(classItem.created_at).toLocaleDateString() : t('teacher:dashboard.justNow')}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {classes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-4 border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 rounded-lg shadow-[8px_8px_0px_0px_rgba(249,115,22,0.2)]">
                <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-6 rounded-full mb-6 border-3 border-orange-300">
                  <BookOpen className="h-20 w-20 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-black uppercase text-gray-900 dark:text-white">{t('teacher:dashboard.noClasses')}</h3>
                <p className="mb-8 font-bold text-gray-600 dark:text-gray-400">{t('teacher:dashboard.createFirstClass')}</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="gap-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white hover:from-orange-500 hover:to-amber-600 border-3 border-orange-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] font-black"
                >
                  <Plus className="h-5 w-5" />
                  {t('teacher:dashboard.createClass')}
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
