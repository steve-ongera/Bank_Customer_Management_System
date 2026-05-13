// Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { customerAPI, transactionAPI } from '../utils/api'
import { useAuth } from '../utils/auth'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid var(--gray-100)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: 'var(--shadow)',
        fontSize: 13,
      }}>
        <p style={{ color: 'var(--gray-500)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 600, margin: 0 }}>
            {p.name}: ${Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    recentTransactions: [],
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [dailyData,   setDailyData]   = useState([])
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

      const customers    = customersRes.data.results    ?? customersRes.data
      const transactions = transactionsRes.data.results ?? transactionsRes.data

      const totalBalance = customers.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0)

      setStats({
        totalCustomers:     customers.length,
        totalBalance:       totalBalance,
        totalTransactions:  transactions.length,
        recentTransactions: transactions.slice(0, 5),
      })

      buildMonthlyData(transactions)
      buildDailyData(transactions)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Monthly deposits vs withdrawals for the current year
  const buildMonthlyData = (transactions) => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const map = {}
    MONTHS.forEach((m, i) => { map[i] = { month: m, deposits: 0, withdrawals: 0 } })
    const thisYear = new Date().getFullYear()
    transactions.forEach(t => {
      const d = new Date(t.created_at)
      if (d.getFullYear() !== thisYear) return
      const amt = parseFloat(t.amount)
      if (t.transaction_type === 'deposit')    map[d.getMonth()].deposits    += amt
      if (t.transaction_type === 'withdrawal') map[d.getMonth()].withdrawals += amt
    })
    setMonthlyData(Object.values(map))
  }

  // Daily volume — last 14 days
  const buildDailyData = (transactions) => {
    const map = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      map[key] = {
        date:   d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        volume: 0,
      }
    }
    transactions.forEach(t => {
      const key = t.created_at?.slice(0, 10)
      if (map[key]) map[key].volume += parseFloat(t.amount)
    })
    setDailyData(Object.values(map))
  }

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers,                     icon: 'bi-people',           color: 'primary' },
    { title: 'Total Balance',   value: `$${stats.totalBalance.toLocaleString()}`, icon: 'bi-cash',             color: 'success' },
    { title: 'Transactions',    value: stats.totalTransactions,                   icon: 'bi-arrow-left-right', color: 'info'    },
  ]

  if (loading) return <div className="text-center mt-5">Loading...</div>

  return (
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <h3>Welcome back, {user?.first_name || user?.username}!</h3>
        <p>Here's what's happening with your bank today.</p>
      </div>

      {/* ── Stat Cards ── */}
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

      {/* ── Charts Row ── */}
      <div className="chart-grid">

        {/* Monthly Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h5>Monthly Overview</h5>
            <span className="badge bg-primary">{new Date().getFullYear()}</span>
          </div>
          <div className="card-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#939aaf' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#939aaf' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="deposits"    name="Deposits"    fill="#4f63f8" radius={[4,4,0,0]} />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="#f87171" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Daily Area Chart */}
        <div className="card">
          <div className="card-header">
            <h5>Daily Volume</h5>
            <span className="badge bg-info">Last 14 days</span>
          </div>
          <div className="card-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4f63f8" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4f63f8" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#939aaf' }}
                    axisLine={false} tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#939aaf' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="Volume"
                    stroke="#4f63f8"
                    strokeWidth={2.5}
                    fill="url(#volGrad)"
                    dot={{ fill: '#4f63f8', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* ── Recent Transactions ── */}
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
                        <span className={`badge bg-${
                          transaction.transaction_type === 'deposit'    ? 'success' :
                          transaction.transaction_type === 'withdrawal' ? 'danger'  : 'warning'
                        }`}>
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