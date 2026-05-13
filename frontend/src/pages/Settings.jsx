import React, { useState, useEffect } from 'react'
import { settingsAPI } from '../utils/api'

function Settings() {
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    two_factor_auth: false,
    language: 'en',
    theme: 'light',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings()
      setSettings(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setSettings({ ...settings, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await settingsAPI.updateSettings(settings)
      setMessage('Settings saved successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Failed to save settings')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h3>System Settings</h3>
      </div>

      {message && <div className={`alert alert-${message.includes('successfully') ? 'success' : 'danger'}`}>{message}</div>}

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5>Notification Preferences</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="email_notifications"
                    name="email_notifications"
                    checked={settings.email_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="email_notifications">
                    Email Notifications
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="sms_notifications"
                    name="sms_notifications"
                    checked={settings.sms_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="sms_notifications">
                    SMS Notifications
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="two_factor_auth"
                    name="two_factor_auth"
                    checked={settings.two_factor_auth}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="two_factor_auth">
                    Two-Factor Authentication
                  </label>
                </div>

                <div className="form-group mb-3">
                  <label>Language</label>
                  <select
                    className="form-select"
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label>Theme</label>
                  <select
                    className="form-select"
                    name="theme"
                    value={settings.theme}
                    onChange={handleChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Settings
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5>Account Information</h5>
            </div>
            <div className="card-body">
              <p><strong>Role:</strong> {settings.role}</p>
              <p><strong>Account Created:</strong> {new Date(settings.created_at).toLocaleDateString()}</p>
              <hr />
              <h6>Security Tips:</h6>
              <ul>
                <li>Use a strong password</li>
                <li>Enable 2FA for better security</li>
                <li>Never share your credentials</li>
                <li>Regularly review your account activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings