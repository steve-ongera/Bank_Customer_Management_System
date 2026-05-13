// Navbar.jsx
import React from 'react'
import { useAuth } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className={`navbar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <i className="bi bi-list"></i>
        </button>
        <h4 className="mb-0">Bank Management System</h4>
      </div>

      <div className="navbar-right">
        <div className="dropdown">
          <button className="dropdown-toggle-btn">
            <i className="bi bi-person-circle"></i>
            <span>{user?.first_name || user?.username}</span>
          </button>
          <div className="dropdown-menu-custom">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard') }}>
              <i className="bi bi-speedometer2"></i> Dashboard
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/reports') }}>
              <i className="bi bi-file-earmark-bar-graph"></i> Reports
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/analysis') }}>
              <i className="bi bi-graph-up"></i> Analysis
            </a>
            <hr />
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/profile') }}>
              <i className="bi bi-person"></i> Profile
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/settings') }}>
              <i className="bi bi-gear"></i> Settings
            </a>
            <hr />
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout() }}>
              <i className="bi bi-box-arrow-right"></i> Logout
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar