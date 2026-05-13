// Reports.jsx
import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { customerAPI, transactionAPI } from '../utils/api'

const CustomTooltip = ({ active, payload, label, prefix = '$' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #edeef2',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(14,17,32,0.10)',
        fontSize: 13,
      }}>
        <p style={{ color: '#6b7290', marginBottom: 6, fontWeight: 600 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {prefix}{Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function Reports() {
  const [transactions, setTransactions] = useState([])
  const [customers, setCustomers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [period, setPeriod]             = useState('monthly')
  const [year, setYear]                 = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [txRes, custRes] = await Promise.all([
        transactionAPI.getAll(),
        customerAPI.getAll(),
      ])
      setTransactions(txRes.data.results ?? txRes.data)
      setCustomers(custRes.data.results ?? custRes.data)
    } catch (err) {
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Aggregate helpers ──
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const QUARTERS = ['Q1','Q2','Q3','Q4']

  const getMonthlyData = () => {
    const map = {}
    MONTHS.forEach((m, i) => { map[i] = { month: m, deposits: 0, withdrawals: 0, net: 0 } })
    transactions.forEach(t => {
      const d = new Date(t.created_at)
      if (d.getFullYear() !== Number(year)) return
      const m = d.getMonth()
      const amt = parseFloat(t.amount)
      if (t.transaction_type === 'deposit')    { map[m].deposits    += amt }
      else if (t.transaction_type === 'withdrawal') { map[m].withdrawals += amt }
    })
    return Object.values(map).map(r => ({ ...r, net: r.deposits - r.withdrawals }))
  }

  const getQuarterlyData = () => {
    const map = { 0: { q: 'Q1', deposits: 0, withdrawals: 0 }, 1: { q: 'Q2', deposits: 0, withdrawals: 0 }, 2: { q: 'Q3', deposits: 0, withdrawals: 0 }, 3: { q: 'Q4', deposits: 0, withdrawals: 0 } }
    transactions.forEach(t => {
      const d = new Date(t.created_at)
      if (d.getFullYear() !== Number(year)) return
      const q = Math.floor(d.getMonth() / 3)
      const amt = parseFloat(t.amount)
      if (t.transaction_type === 'deposit')    map[q].deposits    += amt
      else if (t.transaction_type === 'withdrawal') map[q].withdrawals += amt
    })
    return Object.values(map).map(r => ({ ...r, net: r.deposits - r.withdrawals }))
  }

  const chartData = period === 'monthly' ? getMonthlyData() : getQuarterlyData()
  const xKey     = period === 'monthly' ? 'month' : 'q'

  // ── Summary stats ──
  const totalDeposits    = transactions.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalWithdrawals = transactions.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + parseFloat(t.amount), 0)
  const netFlow          = totalDeposits - totalWithdrawals
  const avgTransaction   = transactions.length ? (totalDeposits + totalWithdrawals) / transactions.length : 0
  const totalBalance     = customers.reduce((s, c) => s + parseFloat(c.balance || 0), 0)

  // ── Top customers by balance ──
  const topCustomers = [...customers]
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
    .slice(0, 8)

  // ── Recent transactions list ──
  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  const fmtCurrency = (v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading reports…</span>
      </div>
    )
  }

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h3>Financial Reports</h3>
          <p>Transaction analysis and performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ maxWidth: 130 }}
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <select
            className="form-control"
            style={{ maxWidth: 100 }}
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="metric-row">
        <div className="metric-card">
          <span className="metric-value" style={{ color: '#16a34a' }}>{fmtCurrency(totalDeposits)}</span>
          <div className="metric-label">Total Deposits</div>
          <div className="metric-sub" style={{ color: '#16a34a' }}>
            <i className="bi bi-arrow-up" /> All time
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-value" style={{ color: '#dc2626' }}>{fmtCurrency(totalWithdrawals)}</span>
          <div className="metric-label">Total Withdrawals</div>
          <div className="metric-sub" style={{ color: '#dc2626' }}>
            <i className="bi bi-arrow-down" /> All time
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-value" style={{ color: netFlow >= 0 ? '#16a34a' : '#dc2626' }}>
            {fmtCurrency(Math.abs(netFlow))}
          </span>
          <div className="metric-label">Net Cash Flow</div>
          <div className="metric-sub" style={{ color: netFlow >= 0 ? '#16a34a' : '#dc2626' }}>
            {netFlow >= 0 ? '↑ Positive' : '↓ Negative'}
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-value">{fmtCurrency(avgTransaction)}</span>
          <div className="metric-label">Avg. Transaction</div>
          <div className="metric-sub">{transactions.length} total</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-grid">
        {/* Volume Chart */}
        <div className="card">
          <div className="card-header">
            <h5>Transaction Volume</h5>
            <span className="badge bg-primary">{period}</span>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#939aaf' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#939aaf' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="deposits"    name="Deposits"    fill="#4f63f8" radius={[4,4,0,0]} />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="#f87171" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Net Flow Chart */}
        <div className="card">
          <div className="card-header">
            <h5>Net Cash Flow</h5>
            <span className="badge bg-success">Trend</span>
          </div>
          <div className="card-body">
            <div className="chart-container" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#939aaf' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#939aaf' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Flow"
                    stroke="#4f63f8"
                    strokeWidth={2.5}
                    dot={{ fill: '#4f63f8', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="chart-grid">
        {/* Top Customers */}
        <div className="card">
          <div className="card-header">
            <h5>Top Customers by Balance</h5>
            <span className="text-muted" style={{ fontSize: 12 }}>Top 8</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Account</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted" style={{ padding: '32px 0' }}>No data</td></tr>
                ) : topCustomers.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: '#939aaf', fontWeight: 600, fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.first_name} {c.last_name}</div>
                      <div style={{ fontSize: 11, color: '#939aaf' }}>{c.email}</div>
                    </td>
                    <td><span className="text-mono">{c.account_number}</span></td>
                    <td style={{ fontWeight: 700, color: '#1f2438' }}>{fmtCurrency(c.balance)}</td>
                    <td><span className={`badge bg-${c.status === 'active' ? 'success' : 'danger'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h5>Recent Transactions</h5>
            <span className="text-muted" style={{ fontSize: 12 }}>Last 10</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted" style={{ padding: '32px 0' }}>No transactions</td></tr>
                ) : recentTx.map(t => (
                  <tr key={t.id}>
                    <td><span className="text-mono">{t.transaction_id}</span></td>
                    <td>
                      <span className={`badge bg-${t.transaction_type === 'deposit' ? 'success' : 'danger'}`}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(t.amount)}</td>
                    <td style={{ color: '#939aaf', fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports