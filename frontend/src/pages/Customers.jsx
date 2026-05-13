import React, { useState, useEffect } from 'react'
import { customerAPI } from '../utils/api'
import CustomerModal from '../components/CustomerModal'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showTransactions, setShowTransactions] = useState(false)
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll()
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id)
        fetchCustomers()
      } catch (error) {
        console.error('Error deleting customer:', error)
      }
    }
  }

  const handleViewTransactions = async (customer) => {
    try {
      const response = await customerAPI.getTransactions(customer.id)
      setTransactions(response.data)
      setSelectedCustomer(customer)
      setShowTransactions(true)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleTransaction = async (customer, type, amount, description) => {
    try {
      if (type === 'deposit') {
        await customerAPI.deposit(customer.id, amount, description)
      } else {
        await customerAPI.withdraw(customer.id, amount, description)
      }
      fetchCustomers()
    } catch (error) {
      console.error(`Error making ${type}:`, error)
      alert(error.response?.data?.error || `Failed to make ${type}`)
    }
  }

  if (loading) return <div className="text-center mt-5">Loading...</div>

  return (
    <div className="customers-page">
      <div className="page-header">
        <h3>Customer Management</h3>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle"></i> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Account Type</th>
                  <th>Account Number</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.customer_id}</td>
                    <td>{customer.first_name} {customer.last_name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.account_type}</td>
                    <td>{customer.account_number}</td>
                    <td>${parseFloat(customer.balance).toLocaleString()}</td>
                    <td>
                      <span className={`badge bg-${customer.status === 'active' ? 'success' : 'danger'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleViewTransactions(customer)}
                        title="View Transactions"
                      >
                        <i className="bi bi-receipt"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleTransaction(customer, 'deposit', 100, 'Manual deposit')}
                        title="Deposit $100"
                      >
                        <i className="bi bi-plus-circle"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleTransaction(customer, 'withdrawal', 50, 'Manual withdrawal')}
                        title="Withdraw $50"
                      >
                        <i className="bi bi-dash-circle"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(customer.id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CustomerModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={fetchCustomers}
      />

      {showTransactions && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Transactions - {selectedCustomer?.first_name} {selectedCustomer?.last_name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTransactions(false)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Balance After</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{transaction.transaction_id}</td>
                          <td>
                            <span className={`badge bg-${transaction.transaction_type === 'deposit' ? 'success' : 'danger'}`}>
                              {transaction.transaction_type}
                            </span>
                          </td>
                          <td>${parseFloat(transaction.amount).toLocaleString()}</td>
                          <td>{transaction.description || '-'}</td>
                          <td>${parseFloat(transaction.balance_after).toLocaleString()}</td>
                          <td>{new Date(transaction.created_at).toLocaleString()}</td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowTransactions(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers