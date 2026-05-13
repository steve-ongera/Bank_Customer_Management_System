// Sidebar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'

function Sidebar({ sidebarOpen }) {
  const menuItems = [
    { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/customers', icon: 'bi-people',        label: 'Customers' },
    { path: '/reports',   icon: 'bi-file-earmark-bar-graph', label: 'Reports'   },
    { path: '/analysis',  icon: 'bi-graph-up',      label: 'Analysis'  },
    { path: '/profile',   icon: 'bi-person',         label: 'Profile'   },
    { path: '/settings',  icon: 'bi-gear',            label: 'Settings'  },
  ]

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <i className="bi bi-bank"></i>
        {sidebarOpen && <span>Bank System</span>}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-label={item.label}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar