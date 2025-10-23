import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/Home'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import StudentClassDetail from '@/pages/student/ClassDetail'
import StudentProblemView from '@/pages/student/ProblemView'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import TeacherClassDetail from '@/pages/teacher/ClassDetail'
import TeacherCreateProblem from '@/pages/teacher/CreateProblem'
import TeacherProblemView from '@/pages/teacher/ProblemView'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Student routes */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/class/:id" element={<StudentClassDetail />} />
      <Route path="/student/problem/:id" element={<StudentProblemView />} />
      
      {/* Teacher routes */}
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/class/:id" element={<TeacherClassDetail />} />
      <Route path="/teacher/class/:id/create-problem" element={<TeacherCreateProblem />} />
      <Route path="/teacher/problem/:id" element={<TeacherProblemView />} />
    </Routes>
  )
}

export default App
