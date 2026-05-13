import React, { useState } from 'react'
import { useAuth } from '../utils/auth'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (isLogin) {
        await login(formData.username, formData.password)
      } else {
        if (formData.password !== formData.confirm_password) {
          setError('Passwords do not match')
          return
        }
        await register(formData)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <i className="bi bi-bank"></i>
          <h2>Bank Management System</h2>
          <p>{isLogin ? 'Login to your account' : 'Create a new account'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  className="form-control"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="form-control"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                className="form-control"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="login-footer">
          <button
            className="btn-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login