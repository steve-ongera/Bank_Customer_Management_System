// App.jsx
import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Customers  from './pages/Customers'
import Reports    from './pages/Reports'
import Analysis   from './pages/Analysis'
import Profile    from './pages/Profile'
import Settings   from './pages/Settings'
import Navbar     from './components/Navbar'
import Sidebar    from './components/Sidebar'
import { AuthProvider, useAuth } from './utils/auth'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function AppContent() {
  const { token } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      <Sidebar sidebarOpen={sidebarOpen} />
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Routes>
          <Route path="/"          element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/reports"   element={<PrivateRoute><Reports  /></PrivateRoute>} />
          <Route path="/analysis"  element={<PrivateRoute><Analysis /></PrivateRoute>} />
          <Route path="/profile"   element={<PrivateRoute><Profile  /></PrivateRoute>} />
          <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App