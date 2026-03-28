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
          <div className="stat-value" style={{ fontSize: 20 }}>{fmt(paidRevenue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Task Breakdown */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 14 }}>Tasks by Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['PENDING', '🕐'], ['IN_PROGRESS', '⚡'], ['COMPLETED', '✅'], ['OVERDUE', '🔴']].map(([s, icon]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <span>{icon}</span> {s.replace('_', ' ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((tasks[s] || 0) / Math.max(1, stats?.counts?.totalTasks)) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 20, textAlign: 'right' }}>{tasks[s] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 14 }}>Recent Invoices</div>
          {stats?.recentInvoices?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.recentInvoices.map((inv) => (
                <div key={inv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.invoiceNumber}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{inv.customer?.name} · {fmtDate(inv.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(inv.amount)}</div>
                    <Badge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No invoices yet</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
