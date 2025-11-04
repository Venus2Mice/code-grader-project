import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from '@/components/error-boundary'
import HomePage from '@/pages/Home'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentClassDetail from '@/pages/student/ClassDetail'
import StudentProblemDetail from '@/pages/student/ProblemDetail'
import StudentProblemView from '@/pages/student/ProblemView'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import TeacherClassDetail from '@/pages/teacher/ClassDetail'
import TeacherCreateProblem from '@/pages/teacher/CreateProblem'
import TeacherEditProblem from '@/pages/teacher/EditProblem'
import TeacherProblemView from '@/pages/teacher/ProblemView'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Student routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/class/:token" element={<StudentClassDetail />} />
        <Route path="/student/problem/:token/detail" element={<StudentProblemDetail />} />
        <Route path="/student/problem/:token" element={<StudentProblemView />} />
        
        {/* Teacher routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/class/:token" element={<TeacherClassDetail />} />
        <Route path="/teacher/class/:token/create-problem" element={<TeacherCreateProblem />} />
        <Route path="/teacher/problem/:token/edit" element={<TeacherEditProblem />} />
        <Route path="/teacher/problem/:token" element={<TeacherProblemView />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
