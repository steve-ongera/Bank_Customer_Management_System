import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from './api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  const login = async (username, password) => {
    const response = await authAPI.login({ username, password })
    setToken(response.data.token)
    setUser(response.data.user)
    return response.data
  }

  const register = async (userData) => {
    const response = await authAPI.register(userData)
    setToken(response.data.token)
    setUser(response.data.user)
    return response.data
  }

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}