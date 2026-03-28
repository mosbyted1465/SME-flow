import React, { useEffect, useState, useCallback } from 'react';
import { invoicesAPI, customersAPI } from '../services/api';
import Layout from '../components/Layout';
import { Spinner, Alert, EmptyState, Badge, Modal } from '../components/UI';

const EMPTY_FORM = { customer: '', amount: '', status: 'DRAFT', dueDate: '', notes: '' };
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const InvoicesPage = () => {
  const [data, setData] = useState({ invoices: [], total: 0 });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const { data: res } = await invoicesAPI.list(params);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    customersAPI.list().then(({ data }) => setCustomers(data.data.customers)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    setFormError('');
    setSaving(true);
    try {
      await invoicesAPI.create({ ...form, amount: parseFloat(form.amount) });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await invoicesAPI.updateStatus(id, status);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-subtitle">{data.total} total invoices</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowModal(true); setFormError(''); setForm(EMPTY_FORM); }}
        >
          + New Invoice
        </button>
      </div>

      <div className="card">
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['', ...INVOICE_STATUSES].map((s) => (
            <button
              key={s || 'all'}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus(s)}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div style={{ display: 'flex', gap: 10, padding: '20px 0', color: 'var(--text-muted)' }}>
            <Spinner /> Loading…
          </div>
        ) : data.invoices.length === 0 ? (
          <EmptyState icon="🧾" message="No invoices yet. Create your first one!" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="primary mono">{inv.invoiceNumber}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inv.customer?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.customer?.company}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(inv.amount)}</td>
                    <td><Badge status={inv.status} /></td>
                    <td>{inv.dueDate ? fmtDate(inv.dueDate) : '—'}</td>
                    <td>{fmtDate(inv.createdAt)}</td>
                    <td>
                      {updatingId === inv._id ? (
                        <Spinner />
                      ) : (
                        <select
                          className="form-select"
                          style={{ padding: '5px 8px', width: 'auto', fontSize: 12 }}
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                          disabled={inv.status === 'CANCELLED' || inv.status === 'PAID'}
                        >
                          {INVOICE_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="New Invoice"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Spinner /> : 'Create Invoice'}
              </button>
            </>
          }
        >
          {formError && <Alert>{formError}</Alert>}

          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" name="customer" value={form.customer} onChange={handleChange} required>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.company || c.email})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                className="form-input" type="number" name="amount" min="0" step="0.01"
                value={form.amount} onChange={handleChange} placeholder="0.00" required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              className="form-input" name="notes" value={form.notes} onChange={handleChange}
              placeholder="Optional notes or payment terms"
            />
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default InvoicesPage;
