import React, { useState, useEffect } from 'react'
import { userAPI } from '../utils/api'
import { useAuth } from '../utils/auth'

function Profile() {
  const { user: currentUser, updateUser } = useAuth()
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile()
      setProfile(response.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await userAPI.updateProfile(profile)
      setProfile(response.data)
      updateUser(response.data)
      setMessage('Profile updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setError('Failed to update profile')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      await userAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      })
      setMessage('Password changed successfully')
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setError('Failed to change password')
      setTimeout(() => setError(''), 3000)
    }
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h3>Profile Settings</h3>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Personal Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group mb-3">
                  <label>Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={currentUser?.username}
                    disabled
                  />
                </div>

                <div className="form-group mb-3">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className="form-control"
                    value={profile.first_name}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className="form-control"
                    value={profile.last_name}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={profile.email}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={profile.phone || ''}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    rows="3"
                    value={profile.address || ''}
                    onChange={handleProfileChange}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  Update Profile
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Change Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group mb-3">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="old_password"
                    className="form-control"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    className="form-control"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    className="form-control"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-warning">
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile