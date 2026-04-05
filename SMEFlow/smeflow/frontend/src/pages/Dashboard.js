import React, { useEffect, useState } from 'react';
import { invoicesAPI } from '../services/api';
import Layout from '../components/Layout';
import { Spinner, Badge } from '../components/UI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesAPI.dashboard()
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}><Spinner /> Loading dashboard…</div></Layout>;

  const tasks = stats?.tasksByStatus || {};
  const invoiceStats = stats?.invoicesByStatus || {};
  const totalRevenue = Object.values(invoiceStats).reduce((s, v) => s + (v.total || 0), 0);
  const paidRevenue = invoiceStats.PAID?.total || 0;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your CRM & workflow activity</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Customers</div>
          <div className="stat-value">{stats?.counts?.totalCustomers ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{stats?.counts?.totalTasks ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-label">Invoices</div>
          <div className="stat-value">{stats?.counts?.totalInvoices ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Paid Revenue</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{fmt(paidRevenue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
        {/* Task Breakdown */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 24, fontSize: 16, background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>📊 Tasks by Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[['PENDING', '🕐'], ['IN_PROGRESS', '⚡'], ['COMPLETED', '✅'], ['OVERDUE', '🔴']].map(([s, icon]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span> {s.replace('_', ' ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, height: 6, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((tasks[s] || 0) / Math.max(1, stats?.counts?.totalTasks)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 24, textAlign: 'right', fontSize: 15 }}>{tasks[s] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 24, fontSize: 16, background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>📄 Recent Invoices</div>
          {stats?.recentInvoices?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentInvoices.map((inv) => (
                <div 
                  key={inv._id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.1)';
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{inv.invoiceNumber}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{inv.customer?.name} · {fmtDate(inv.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{fmt(inv.amount)}</div>
                    <div style={{ marginTop: 4 }}>
                      <Badge status={inv.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>No invoices yet</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
