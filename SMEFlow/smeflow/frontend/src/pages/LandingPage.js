import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const problemCards = [
  {
    title: '📊 Business Analyst',
    description: 'Real-time insights into revenue, customers, and pipeline. See what matters at a glance.',
    icon: (
      <path
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: '⚙️ Operations Manager',
    description: 'Automate task reminders, follow-ups, and workflows. Never miss a beat again.',
    icon: (
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: '💰 Finance Assistant',
    description: 'Track payments, invoices, and cash flow. Reduce late payments and boost revenue.',
    icon: (
      <path
        d="M12 8c-2.2 0-4 1.3-4 3s1.8 3 4 3 4 1.3 4 3-1.8 3-4 3m0-12c1.3 0 2.4.5 3.2 1.2M12 8V6m0 12v2m10-10a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: '👥 CRM Hub',
    description: 'Organize all customer data, communications, and interactions in one place.',
    icon: (
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-1.5 7v-2a3 3 0 0 0-3-3h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: '📈 Performance Tracking',
    description: 'Monitor key metrics and KPIs with visual dashboards and detailed reports.',
    icon: (
      <path
        d="M3 3h18v18H3V3zm8 8h8m-8 4h8M7 7h2v10H7V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: '🔄 Workflow Automation',
    description: 'Reduce manual work with intelligent automation and seamless integrations.',
    icon: (
      <path
        d="M4 4v5h.5m15-5v5h-.5M4 20a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const steps = [
  'Upload Excel',
  'We organize your data',
  'Get insights instantly',
];

const previewMetrics = [
  { label: 'Revenue', value: '$128.4K', trend: '+12.4%' },
  { label: 'Customers', value: '1,248', trend: '+86' },
  { label: 'Pending Tasks', value: '34', trend: '-9' },
];

const sampleRows = [
  { name: 'Nimbus Labs', status: 'Paid', amount: '$8,500', due: 'Today' },
  { name: 'VertexForge', status: 'Overdue', amount: '$4,200', due: '3 days ago' },
  { name: 'BluePeak Logistics', status: 'Pending', amount: '$12,750', due: 'In 4 days' },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-slate-100" style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a2847 25%, #0f1419 50%, #1f2937 100%)' }}>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>



      <main className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <style>{`
          @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
          @keyframes glow { 0%, 100% { box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 12px 48px rgba(59, 130, 246, 0.6); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        `}</style>
        <section style={{ textAlign: 'center', marginTop: 0, marginBottom: 80 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeInUp 0.8s ease-out 0.2s backwards' }}>
            <h2 style={{ fontSize: 'clamp(28px, 7vw, 52px)', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 24, background: 'linear-gradient(135deg, #f1f5f9 0%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>
              Ready to escape spreadsheet hell?
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#cbd5e1', marginBottom: 40 }}>
              Join 500+ SME founders using SMEFlow to manage their business better.
            </p>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/register"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', color: 'white', padding: '16px 40px', borderRadius: '10px', fontWeight: 700, fontSize: 16, boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)', cursor: 'pointer', transition: 'all 0.3s', textDecoration: 'none', animation: 'fadeInUp 0.8s ease-out 0.3s backwards' }}
                onMouseEnter={(e) => { e.target.style.boxShadow = '0 16px 48px rgba(59, 130, 246, 0.6)'; e.target.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)'; e.target.style.transform = 'translateY(0)'; }}
              >
                🚀 Get Started Free
              </Link>
              <Link
                to="/login"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #475569', background: 'rgba(30, 41, 59, 0.6)', color: '#e2e8f0', padding: '14px 40px', borderRadius: '10px', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s', textDecoration: 'none', backdropFilter: 'blur(8px)', animation: 'fadeInUp 0.8s ease-out 0.4s backwards' }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'rgba(59, 130, 246, 0.15)'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = '#475569'; e.target.style.background = 'rgba(30, 41, 59, 0.6)'; }}
              >
                Already signed up? Sign In
              </Link>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 80, textAlign: 'center', paddingTop: 80, paddingBottom: 80, borderTop: '1px solid rgba(59, 130, 246, 0.2)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: '700px', margin: '0 auto' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', padding: '16px 24px', borderRadius: '16px', fontWeight: 'bold', color: 'white', boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)', fontSize: 24, animation: 'fadeInUp 0.8s ease-out 0.2s backwards', display: 'inline-block', letterSpacing: '-0.5px' }}>
                SMEFlow
              </div>
            </Link>
            <div style={{ animation: 'fadeInUp 0.8s ease-out 0.4s backwards' }}>
              <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', lineHeight: 1.5, color: '#f1f5f9', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>
                Your business analyst,
              </p>
            </div>
            <div style={{ animation: 'fadeInUp 0.8s ease-out 0.5s backwards' }}>
              <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', lineHeight: 1.5, color: '#f1f5f9', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>
                operations manager, and
              </p>
            </div>
            <div style={{ animation: 'fadeInUp 0.8s ease-out 0.6s backwards' }}>
              <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', lineHeight: 1.5, color: '#f1f5f9', fontWeight: 600, letterSpacing: '-0.3px', margin: 0 }}>
                finance assistant —
              </p>
            </div>
            <div style={{ animation: 'fadeInUp 0.8s ease-out 0.7s backwards' }}>
              <p style={{ fontSize: 'clamp(18px, 4vw, 28px)', lineHeight: 1.5, color: '#60a5fa', fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>
                in one place.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 120 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
              {problemCards.map((card, idx) => (
                <div
                  key={card.title}
                  style={{ borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)', padding: 40, transition: 'all 0.3s', cursor: 'pointer', animation: `fadeInUp 0.8s ease-out ${0.6 + idx * 0.12}s backwards` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)';
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.boxShadow = '0 24px 48px rgba(59, 130, 246, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', color: '#60a5fa' }} aria-hidden="true">
                      {card.icon}
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14, color: '#f1f5f9' }}>{card.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: '#cbd5e1' }}>{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 80 }}>
          <div style={{ borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)', padding: '64px 48px', textAlign: 'center', animation: 'fadeInUp 0.8s ease-out 0.3s backwards' }}>
            <h2 style={{ fontSize: 'clamp(24px, 6vw, 44px)', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: 20, color: '#f1f5f9', fontWeight: 700 }}>
              3 minutes to complete visibility
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#cbd5e1', maxWidth: '70ch', margin: '0 auto 48px' }}>
              No complex setup. No training. Just upload your Excel file and start seeing what matters.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              {steps.map((step, index) => (
                <div
                  key={step}
                  style={{ borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'rgba(15, 20, 25, 0.6)', padding: 32, backdropFilter: 'blur(8px)', animation: `fadeInUp 0.8s ease-out ${0.4 + index * 0.15}s backwards`, transition: 'all 0.3s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                    e.currentTarget.style.background = 'rgba(15, 20, 25, 0.8)';
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.background = 'rgba(15, 20, 25, 0.6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                    {index + 1}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>{step}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
                    {index === 0 && 'Bring your existing spreadsheet or export. We support all common formats.'}
                    {index === 1 && 'Our system organizes everything into customers, tasks, and invoices automatically.'}
                    {index === 2 && 'Access your dashboard and start making better decisions immediately.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid items-center gap-16 py-16 lg:grid-cols-1 lg:py-28 lg:pt-32" style={{ marginTop: 80 }}>
          <div className="max-w-3xl mx-auto text-center" style={{ animation: 'slideInLeft 0.8s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(59, 130, 246, 0.4)', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '24px', padding: '8px 16px', marginBottom: 32, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#60a5fa', animation: 'fadeIn 0.8s ease-out 0.2s backwards' }}>
              🎯 All-in-one Business Platform
            </div>

            <p style={{ fontSize: 'clamp(16px, 5vw, 20px)', lineHeight: 1.6, marginBottom: 24, color: '#cbd5e1', fontWeight: 500, animation: 'fadeInUp 0.8s ease-out 0.25s backwards' }}>
              Your business analyst, operations manager, and finance assistant — in one place.
            </p>

            <h1 style={{ fontSize: 'clamp(40px, 10vw, 72px)', lineHeight: 1, letterSpacing: '-2px', marginBottom: 40, background: 'linear-gradient(135deg, #f1f5f9 0%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'fadeInUp 0.8s ease-out 0.3s backwards', fontWeight: 800 }}>
              Run Your Business to the Top
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.7, color: '#cbd5e1', marginBottom: 48, maxWidth: '80ch', margin: '0 auto 48px', animation: 'fadeInUp 0.8s ease-out 0.4s backwards' }}>
              Stop juggling spreadsheets, emails, and manual tracking. Manage your customers, invoices, tasks, and cash flow all in one intelligent dashboard.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center" style={{ animation: 'fadeInUp 0.8s ease-out 0.5s backwards', marginBottom: 80 }}>
              <Link
                to="/register"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', color: 'white', padding: '16px 40px', borderRadius: '10px', fontWeight: 700, fontSize: 16, boxShadow: '0 12px 32px rgba(59, 130, 246, 0.4)', cursor: 'pointer', transition: 'all 0.3s', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.target.style.boxShadow = '0 16px 48px rgba(59, 130, 246, 0.6)'; e.target.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)'; e.target.style.transform = 'translateY(0)'; }}
              >
                🚀 Start Free Now
              </Link>
              <Link
                to="/login"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #475569', background: 'rgba(30, 41, 59, 0.6)', color: '#e2e8f0', padding: '14px 40px', borderRadius: '10px', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.3s', textDecoration: 'none', backdropFilter: 'blur(8px)' }}
                onMouseEnter={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'rgba(59, 130, 246, 0.15)'; }}
                onMouseLeave={(e) => { e.target.style.borderColor = '#475569'; e.target.style.background = 'rgba(30, 41, 59, 0.6)'; }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', background: 'rgba(15, 20, 25, 0.5)', padding: '40px 20px', textAlign: 'center', marginTop: 80, animation: 'fadeIn 0.8s ease-out 0.8s backwards' }}>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          © 2026 SMEFlow. Built for growing SMEs. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
