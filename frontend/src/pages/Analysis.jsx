// Analysis.jsx
import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { customerAPI, transactionAPI } from '../utils/api'

/* ── Design tokens ── */
const COLORS  = ['#4f63f8', '#16a34a', '#f59e0b', '#0284c7', '#8b5cf6', '#ec4899']
const RCOLORS = { deposit: '#4f63f8', withdrawal: '#f87171', transfer: '#f59e0b' }

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label, prefix = '$' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white', border: '1px solid #edeef2',
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(14,17,32,0.10)', fontSize: 13,
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

/* ── Pie Label ── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function Analysis() {
  const [transactions, setTransactions] = useState([])
  const [customers, setCustomers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState('overview')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [txRes, custRes] = await Promise.all([
        transactionAPI.getAll(),
        customerAPI.getAll(),
      ])
      setTransactions(txRes.data.results ?? txRes.data)
      setCustomers(custRes.data.results ?? custRes.data)
    } catch (err) {
      console.error('Analysis fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Derived Data ── */

  // Daily trend (last 30 days)
  const dailyTrend = (() => {
    const map = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      map[key] = { date: key, deposits: 0, withdrawals: 0, volume: 0 }
    }
    transactions.forEach(t => {
      const key = t.created_at?.slice(0, 10)
      if (map[key]) {
        const amt = parseFloat(t.amount)
        if (t.transaction_type === 'deposit')    { map[key].deposits    += amt }
        if (t.transaction_type === 'withdrawal') { map[key].withdrawals += amt }
        map[key].volume += amt
      }
    })
    return Object.values(map).map(r => ({
      ...r,
      date: new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    }))
  })()

  // Transaction type breakdown for pie
  const typeBreakdown = (() => {
    const map = {}
    transactions.forEach(t => {
      if (!map[t.transaction_type]) map[t.transaction_type] = { name: t.transaction_type, value: 0, count: 0 }
      map[t.transaction_type].value += parseFloat(t.amount)
      map[t.transaction_type].count += 1
    })
    return Object.values(map)
  })()

  // Account type distribution
  const accountTypes = (() => {
    const map = {}
    customers.forEach(c => {
      const type = c.account_type || 'unknown'
      if (!map[type]) map[type] = { name: type, customers: 0, balance: 0 }
      map[type].customers += 1
      map[type].balance   += parseFloat(c.balance || 0)
    })
    return Object.values(map)
  })()

  // Balance distribution buckets
  const balanceDistribution = (() => {
    const buckets = [
      { range: '$0–1k',    min: 0,     max: 1000,   count: 0 },
      { range: '$1k–5k',   min: 1000,  max: 5000,   count: 0 },
      { range: '$5k–10k',  min: 5000,  max: 10000,  count: 0 },
      { range: '$10k–50k', min: 10000, max: 50000,  count: 0 },
      { range: '$50k+',    min: 50000, max: Infinity,count: 0 },
    ]
    customers.forEach(c => {
      const b = parseFloat(c.balance || 0)
      const bucket = buckets.find(bk => b >= bk.min && b < bk.max)
      if (bucket) bucket.count++
    })
    return buckets
  })()

  // Monthly customer growth
  const customerGrowth = (() => {
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const map = {}
    MONTHS.forEach((m, i) => { map[i] = { month: m, newCustomers: 0, total: 0 } })
    customers.forEach(c => {
      const d = new Date(c.created_at)
      if (!isNaN(d)) map[d.getMonth()].newCustomers++
    })
    let running = 0
    return Object.values(map).map(r => { running += r.newCustomers; return { ...r, total: running } })
  })()

  // Summary KPIs
  const activeCustomers    = customers.filter(c => c.status === 'active').length
  const inactiveCustomers  = customers.length - activeCustomers
  const totalVolume        = transactions.reduce((s, t) => s + parseFloat(t.amount), 0)
  const depositCount       = transactions.filter(t => t.transaction_type === 'deposit').length
  const withdrawalCount    = transactions.filter(t => t.transaction_type === 'withdrawal').length
  const avgBalance         = customers.length ? customers.reduce((s, c) => s + parseFloat(c.balance || 0), 0) / customers.length : 0

  const fmtCurrency = v => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: 'bi-grid' },
    { id: 'customers',  label: 'Customers',  icon: 'bi-people' },
    { id: 'trends',     label: 'Trends',     icon: 'bi-graph-up' },
  ]

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading analysis…</span>
      </div>
    )
  }

  return (
    <div className="analysis-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h3>Analytics</h3>
          <p>Deep insights into your banking operations</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #edeef2', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #4f63f8' : '2px solid transparent',
              color: activeTab === tab.id ? '#4f63f8' : '#6b7290',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.2s',
            }}
          >
            <i className={`bi ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Row */}
          <div className="metric-row">
            <div className="metric-card">
              <span className="metric-value">{customers.length}</span>
              <div className="metric-label">Total Customers</div>
              <div className="metric-sub" style={{ color: '#16a34a' }}>{activeCustomers} active</div>
            </div>
            <div className="metric-card">
              <span className="metric-value">{transactions.length}</span>
              <div className="metric-label">Total Transactions</div>
              <div className="metric-sub">{depositCount}D / {withdrawalCount}W</div>
            </div>
            <div className="metric-card">
              <span className="metric-value" style={{ fontSize: 22 }}>{fmtCurrency(totalVolume)}</span>
              <div className="metric-label">Total Volume</div>
              <div className="metric-sub" style={{ color: '#4f63f8' }}>All time</div>
            </div>
            <div className="metric-card">
              <span className="metric-value" style={{ fontSize: 22 }}>{fmtCurrency(avgBalance)}</span>
              <div className="metric-label">Avg Balance</div>
              <div className="metric-sub">Per customer</div>
            </div>
          </div>

          {/* Pie + Balance Dist */}
          <div className="chart-grid">
            <div className="card">
              <div className="card-header">
                <h5>Transaction Breakdown</h5>
                <span className="badge bg-primary">by volume</span>
              </div>
              <div className="card-body" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ height: 220, flex: '1 1 180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeBreakdown}
                        cx="50%" cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {typeBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => [`$${Number(v).toLocaleString()}`, 'Volume']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {typeBreakdown.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: '#1f2438' }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: '#939aaf' }}>{t.count} txns · {fmtCurrency(t.value)}</div>
                      </div>
                    </div>
                  ))}
                  {typeBreakdown.length === 0 && <p style={{ color: '#939aaf', fontSize: 13 }}>No data</p>}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5>Balance Distribution</h5>
                <span className="badge bg-secondary">customers</span>
              </div>
              <div className="card-body">
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={balanceDistribution} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#939aaf' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#939aaf' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip prefix="" />} />
                      <Bar dataKey="count" name="Customers" fill="#4f63f8" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CUSTOMERS TAB ── */}
      {activeTab === 'customers' && (
        <>
          <div className="chart-grid">
            {/* Account type chart */}
            <div className="card">
              <div className="card-header">
                <h5>Account Types</h5>
                <span className="badge bg-primary">distribution</span>
              </div>
              <div className="card-body">
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountTypes} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#939aaf' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7290', textTransform: 'capitalize' }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<CustomTooltip prefix="" />} />
                      <Bar dataKey="customers" name="Customers" fill="#4f63f8" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Active vs Inactive */}
            <div className="card">
              <div className="card-header">
                <h5>Customer Status</h5>
                <span className="badge bg-secondary">breakdown</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ height: 200, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active',   value: activeCustomers },
                          { name: 'Inactive', value: inactiveCustomers },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        dataKey="value"
                        label={renderPieLabel}
                        labelLine={false}
                      >
                        <Cell fill="#16a34a" />
                        <Cell fill="#f87171" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>{activeCustomers}</div>
                    <div style={{ fontSize: 11, color: '#939aaf', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</div>
                  </div>
                  <div style={{ width: 1, background: '#edeef2' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{inactiveCustomers}</div>
                    <div style={{ fontSize: 11, color: '#939aaf', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inactive</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Growth */}
          <div className="card">
            <div className="card-header">
              <h5>Customer Growth</h5>
              <span className="badge bg-success">cumulative</span>
            </div>
            <div className="card-body">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customerGrowth}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4f63f8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4f63f8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#939aaf' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#939aaf' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip prefix="" />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Area type="monotone" dataKey="total"       name="Total"    stroke="#4f63f8" strokeWidth={2} fill="url(#gradTotal)" />
                    <Area type="monotone" dataKey="newCustomers" name="New"     stroke="#16a34a" strokeWidth={2} fill="url(#gradNew)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TRENDS TAB ── */}
      {activeTab === 'trends' && (
        <>
          {/* Daily Volume - last 30 days */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h5>Daily Transaction Volume — Last 30 Days</h5>
              <span className="badge bg-info">daily</span>
            </div>
            <div className="card-body">
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4f63f8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f63f8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradWdr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f87171" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#939aaf' }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#939aaf' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Area type="monotone" dataKey="deposits"    name="Deposits"    stroke="#4f63f8" strokeWidth={2} fill="url(#gradDep)" />
                    <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#f87171" strokeWidth={2} fill="url(#gradWdr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Daily volume bar */}
          <div className="card">
            <div className="card-header">
              <h5>Total Daily Volume</h5>
              <span className="badge bg-secondary">combined</span>
            </div>
            <div className="card-body">
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTrend} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#939aaf' }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 11, fill: '#939aaf' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volume" name="Volume" fill="#4f63f8" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analysis