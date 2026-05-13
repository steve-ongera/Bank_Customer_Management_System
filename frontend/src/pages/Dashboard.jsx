// Dashboard.jsx

import React, { useState, useEffect } from 'react'
import { customerAPI, transactionAPI } from '../utils/api'
import { useAuth } from '../utils/auth'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    recentTransactions: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [customersRes, transactionsRes] = await Promise.all([
        customerAPI.getAll(),
        transactionAPI.getAll(),
      ])

      const totalBalance = customersRes.data.reduce((sum, c) => sum + parseFloat(c.balance), 0)

      setStats({
        totalCustomers: customersRes.data.length,
        totalBalance: totalBalance,
        totalTransactions: transactionsRes.data.length,
        recentTransactions: transactionsRes.data.slice(0, 5),
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers, icon: 'bi-people', color: 'primary' },
    { title: 'Total Balance', value: `$${stats.totalBalance.toLocaleString()}`, icon: 'bi-cash', color: 'success' },
    { title: 'Transactions', value: stats.totalTransactions, icon: 'bi-arrow-left-right', color: 'info' },
  ]

  if (loading) return <div className="text-center mt-5">Loading...</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h3>Welcome back, {user?.first_name || user?.username}!</h3>
        <p>Here's what's happening with your bank today.</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-icon">
              <i className={`bi ${stat.icon}`}></i>
            </div>
            <div className="stat-info">
              <h6>{stat.title}</h6>
              <h3>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-transactions">
        <div className="card">
          <div className="card-header">
            <h5>Recent Transactions</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.transaction_id}</td>
                      <td>{transaction.customer_name}</td>
                      <td>
                        <span className={`badge bg-${transaction.transaction_type === 'deposit' ? 'success' : transaction.transaction_type === 'withdrawal' ? 'danger' : 'warning'}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td>${parseFloat(transaction.amount).toLocaleString()}</td>
                      <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {stats.recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard