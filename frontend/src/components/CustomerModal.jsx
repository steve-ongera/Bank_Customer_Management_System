import React, { useState } from 'react'
import { customerAPI } from '../utils/api'

function CustomerModal({ show, onClose, onSave }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    account_type: 'savings',
    status: 'active',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await customerAPI.create(formData)
      onSave()
      onClose()
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        account_type: 'savings',
        status: 'active',
      })
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Customer</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="form-control"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="form-control"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label>Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-12 mb-3">
                  <label>Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    rows="2"
                    value={formData.address}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div className="col-md-6 mb-3">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className="form-control"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label>Account Type *</label>
                  <select
                    name="account_type"
                    className="form-select"
                    value={formData.account_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="fixed">Fixed Deposit</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label>Status</label>
                  <select
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CustomerModal