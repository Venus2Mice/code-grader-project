import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/Login'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      {/* More routes will be added */}
    </Routes>
  )
}

export default App
