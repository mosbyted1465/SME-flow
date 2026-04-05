import React, { useEffect, useState, useCallback } from 'react';
import { tasksAPI, customersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Spinner, Alert, EmptyState, Badge, Modal } from '../components/UI';

const EMPTY_FORM = { title: '', description: '', customer: '', dueDate: '', priority: 'MEDIUM', status: 'PENDING' };

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const isOverdue = (task) => task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date();

const TasksPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ tasks: [], total: 0 });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingStatus, setEditingStatus] = useState(null); // { taskId, status }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const { data: res } = await tasksAPI.list(params);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load tasks');
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
      await tasksAPI.create({ ...form, assignedTo: user.id });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      setEditingStatus(null);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update status');
    }
  };

  const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">✓ Tasks</div>
          <div className="page-subtitle">{data.total} total tasks</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormError(''); setForm(EMPTY_FORM); }}>
          ➕ New Task
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {['', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s || 'all'}
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterStatus(s)}
            >
              {s ? s.replace('_', ' ') : 'All Tasks'}
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div style={{ display: 'flex', gap: 10, padding: '20px 0', color: 'var(--text-muted)' }}><Spinner /> Loading…</div>
        ) : data.tasks.length === 0 ? (
          <EmptyState icon="✓" message="No tasks found. Create your first task!" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((t) => (
                  <tr key={t._id}>
                    <td className="primary">{t.title}</td>
                    <td>{t.customer?.name || '—'}</td>
                    <td style={{ color: isOverdue(t) ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {fmtDate(t.dueDate)}
                    </td>
                    <td><Badge priority={t.priority} /></td>
                    <td>
                      {editingStatus?.taskId === t._id ? (
                        <select
                          className="form-select" style={{ padding: '4px 8px', width: 'auto' }}
                          value={editingStatus.status}
                          onChange={(e) => setEditingStatus({ taskId: t._id, status: e.target.value })}
                          onBlur={() => handleStatusUpdate(t._id, editingStatus.status)}
                          autoFocus
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <Badge status={t.status} />
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingStatus({ taskId: t._id, status: t.status })}
                      >
                        Edit Status
                      </button>
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
          title="New Task"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Spinner /> : 'Create Task'}
              </button>
            </>
          }
        >
          {formError && <Alert>{formError}</Alert>}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />
          </div>
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" name="customer" value={form.customer} onChange={handleChange} required>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.company || c.email})</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default TasksPage;
