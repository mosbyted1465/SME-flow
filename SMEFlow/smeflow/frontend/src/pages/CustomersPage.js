import React, { useEffect, useState, useCallback } from 'react';
import { customersAPI } from '../services/api';
import Layout from '../components/Layout';
import { Spinner, Alert, EmptyState, Modal } from '../components/UI';

const EMPTY_FORM = { name: '', email: '', phone: '', company: '' };

const CustomersPage = () => {
  const [data, setData] = useState({ customers: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await customersAPI.list({ search });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setFormError('');
    setSaving(true);
    try {
      await customersAPI.create(form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">{data.total} total records</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); setForm(EMPTY_FORM); }}>
          + Add Customer
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            className="form-input" placeholder="Search by name, email or company…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div style={{ display: 'flex', gap: 10, padding: '20px 0', color: 'var(--text-muted)' }}><Spinner /> Loading…</div>
        ) : data.customers.length === 0 ? (
          <EmptyState icon="👥" message="No customers yet. Add your first one!" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr key={c._id}>
                    <td className="primary">{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.company || '—'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="New Customer"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <Spinner /> : 'Create Customer'}
              </button>
            </>
          }
        >
          {formError && <Alert>{formError}</Alert>}
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Customer name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="customer@company.com" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 …" />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" name="company" value={form.company} onChange={handleChange} placeholder="Acme Corp" />
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default CustomersPage;
