import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import useRefresh from '../hooks/useRefresh';
import CsvUploader from '../components/CsvUploader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Select from '../components/Select';
import {
  Users, UserCog, HardHat, Shield, BarChart3, AlertTriangle, Clock, CheckCircle,
  Plus, Pencil, Trash2, Download, Settings, Bug, TrendingUp, Activity, Search
} from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'officials', label: 'Officials', icon: UserCog },
  { id: 'workers', label: 'Workers', icon: HardHat },
  { id: 'supervisors', label: 'Supervisors', icon: Shield },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
  { id: 'website', label: 'Website Issues', icon: Bug },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'system', label: 'System', icon: Settings },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [websiteIssues, setWebsiteIssues] = useState([]);
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [showCsv, setShowCsv] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [u, w, wi, i, a, c] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/workers/all'),
        api.get('/api/website-issues'),
        api.get('/api/issues'),
        api.get('/api/analytics'),
        api.get('/api/categories'),
      ]);
      setUsers(u); setWorkers(w); setWebsiteIssues(wi); setIssues(i); setAnalytics(a); setCategories(c);
    } catch (err) { console.error(err); }
  }, []);

  const broadcastDataUpdate = () => {
    try {
      localStorage.setItem('prabandh-data-update', `${Date.now()}`);
    } catch (e) {
      console.warn('Unable to broadcast update to other tabs', e);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);
  useRefresh(loadData, 10000);

  const openAdd = (type, defaults = {}) => {
    setEditItem(null);
    setForm(defaults);
    setShowModal(type);
    setShowCsv(false);
  };

  const openEdit = (type, item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowModal(type);
    setShowCsv(false);
  };

  const closeModal = () => { setShowModal(null); setEditItem(null); setForm({}); setShowCsv(false); };

  const saveUser = async () => {
    try {
      if (editItem) {
        await api.patch(`/api/users/${editItem.id}`, form);
      } else {
        await api.post('/api/auth/register', { ...form, role: form.role || 'USER' });
      }
      closeModal(); await loadData(); broadcastDataUpdate();
    } catch (err) { alert(err.message); }
  };

  const deleteUser = async (id) => {
    setConfirmConfig({
      title: 'Delete user',
      message: 'This action cannot be undone. Do you want to continue?',
      onConfirm: async () => {
        try {
          await api.delete(`/api/users/${id}`);
          setConfirmConfig(null);
          await loadData();
          broadcastDataUpdate();
        } catch (err) {
          setConfirmConfig(null);
          alert(err.message);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const saveWorker = async () => {
    try {
      if (editItem) {
        await api.patch(`/api/workers/${editItem.id}`, form);
      } else {
        await api.post('/api/workers', form);
      }
      closeModal(); await loadData(); broadcastDataUpdate();
    } catch (err) { alert(err.message); }
  };

  const deleteWorker = async (id) => {
    setConfirmConfig({
      title: 'Delete worker',
      message: 'Remove this worker from the system? This cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/workers/${id}`);
          setConfirmConfig(null);
          await loadData();
          broadcastDataUpdate();
        } catch (err) {
          setConfirmConfig(null);
          alert(err.message);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const updateWebsiteIssue = async (id, status) => {
    try { await api.patch(`/api/website-issues/${id}`, { status }); await loadData(); broadcastDataUpdate(); } catch (err) { alert(err.message); }
  };

  const deleteIssue = async (id) => {
    setConfirmConfig({
      title: 'Delete issue',
      message: 'Are you sure you want to delete this issue? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/issues/${id}`);
          setConfirmConfig(null);
          await loadData();
          broadcastDataUpdate();
        } catch (err) {
          setConfirmConfig(null);
          alert(err.message);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const deleteWebsiteIssue = async (id) => {
    setConfirmConfig({
      title: 'Delete website issue',
      message: 'Confirm removal of this website issue report.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/website-issues/${id}`);
          setConfirmConfig(null);
          loadData();
        } catch (err) {
          setConfirmConfig(null);
          alert(err.message);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const handleCsvImport = (type) => async (rows) => {
    for (const row of rows) {
      if (type === 'users') {
        await api.post('/api/auth/register', { name: row.Name, email: row.Email, password: row.Password || 'changeme123', role: row.Role || 'USER', phone: row.Phone, department: row.Department });
      } else if (type === 'workers') {
        await api.post('/api/workers', { name: row['Worker Name'] || row.Name, role: row.Role, department: row.Department, phone: row.Phone, availability: row.Availability || 'Available', status: row.Status || 'ACTIVE' });
      } else if (type === 'officials') {
        await api.post('/api/auth/register', { name: row['Official Name'] || row.Name, email: row.Email, password: row.Password || 'changeme123', role: 'OFFICIAL', phone: row.Phone, department: row.Department });
      } else if (type === 'supervisors') {
        await api.post('/api/auth/register', { name: row['Supervisor Name'] || row.Name, email: row.Email, password: row.Password || 'changeme123', role: 'SUPERVISOR', phone: row.Phone, department: row.Department });
      }
    }
    await loadData();
    broadcastDataUpdate();
  };

  const exportCsv = (data, filename, headers) => {
    const csv = [headers.join(','), ...data.map((r) => headers.map((h) => r[h] || '').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter((u) => {
    if (tab === 'users') return u.role === 'USER';
    if (tab === 'officials') return u.role === 'OFFICIAL';
    if (tab === 'supervisors') return u.role === 'SUPERVISOR';
    return true;
  }).filter((u) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const filteredWorkers = workers.filter((w) => !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.role?.toLowerCase().includes(search.toLowerCase()));

  const filteredIssues = issues.filter((i) => !search || i.title?.toLowerCase().includes(search.toLowerCase()));

  const filteredWebIssues = websiteIssues.filter((wi) => !search || wi.title?.toLowerCase().includes(search.toLowerCase()));

  const total = analytics?.totalIssues || 0;
  const pending = analytics?.byStatus?.PENDING || 0;
  const inProgress = analytics?.byStatus?.IN_PROGRESS || 0;
  const resolved = analytics?.byStatus?.RESOLVED || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System overview and management controls.</p>
      </div>

      {/* Metric cards - responsive grid */}
      <div className="responsive-grid-4">
        <MetricCard icon={Activity} label="Total Issues" value={total} color="text-gray-700 dark:text-gray-300" bg="bg-white dark:bg-slate-800" />
        <MetricCard icon={Clock} label="Pending" value={pending} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
        <MetricCard icon={TrendingUp} label="In Progress" value={inProgress} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <MetricCard icon={CheckCircle} label="Resolved" value={resolved} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
      </div>

      {/* Responsive tabs */}
      <div className="responsive-tabs border-b border-gray-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); }} className={`inline-flex shrink-0 items-center gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="relative filter-search">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
        </div>
        {(tab === 'users' || tab === 'officials' || tab === 'workers' || tab === 'supervisors') && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { openAdd(tab); }} className="btn-primary gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Add {tab === 'workers' ? 'Worker' : tab === 'officials' ? 'Official' : tab === 'supervisors' ? 'Supervisor' : 'User'}</button>
            <button onClick={() => { setShowCsv(tab); setShowModal(tab); setEditItem(null); setForm({}); }} className="btn-secondary gap-1.5 text-xs"><Download className="h-3.5 w-3.5" />CSV Import</button>
          </div>
        )}
      </div>

      {tab === 'users' && <UserTable users={filteredUsers} onEdit={(u) => openEdit('users', u)} onDelete={deleteUser} onExport={(selected) => exportCsv(selected.length ? selected : filteredUsers, 'users.csv', ['name', 'email', 'role', 'isActive'])} />}
      {tab === 'officials' && <UserTable users={filteredUsers} onEdit={(u) => openEdit('officials', u)} onDelete={deleteUser} onExport={(selected) => exportCsv(selected.length ? selected : filteredUsers, 'officials.csv', ['name', 'email', 'role', 'isActive'])} />}
      {tab === 'supervisors' && <UserTable users={filteredUsers} onEdit={(u) => openEdit('supervisors', u)} onDelete={deleteUser} onExport={(selected) => exportCsv(selected.length ? selected : filteredUsers, 'supervisors.csv', ['name', 'email', 'role', 'isActive'])} />}
      {tab === 'workers' && <WorkerTable workers={filteredWorkers} onEdit={(w) => openEdit('workers', w)} onDelete={deleteWorker} onExport={(selected) => exportCsv(selected.length ? selected : workers, 'workers.csv', ['name', 'role', 'department', 'phone', 'availability', 'status'])} />}
      {tab === 'issues' && <IssueTable issues={filteredIssues} onDelete={deleteIssue} />}
      {tab === 'website' && <WebsiteIssueTable issues={filteredWebIssues} onUpdate={updateWebsiteIssue} onDelete={deleteWebsiteIssue} />}
      {tab === 'analytics' && <AnalyticsPanel analytics={analytics} categories={categories} />}
      {tab === 'system' && <SystemPanel />}

      <Modal
        open={Boolean(showModal)}
        title={showCsv ? `Import ${tab} via CSV` : editItem ? `Edit ${tab === 'workers' ? 'Worker' : 'User'}` : `Add ${tab === 'workers' ? 'Worker' : tab === 'officials' ? 'Official' : tab === 'supervisors' ? 'Supervisor' : 'User'}`}
        subtitle={showCsv ? `Upload a CSV file to import ${tab}.` : `Manage ${tab} details with a responsive modal.`}
        onClose={closeModal}
      >
        {showCsv ? (
                <CsvUploader
                  onImport={handleCsvImport(tab)}
                  requiredFields={tab === 'workers' ? ['Worker Name', 'Role'] : ['Name', 'Email']}
                  templateHeaders={tab === 'workers' ? ['Worker Name', 'Role', 'Department', 'Phone', 'Availability', 'Status'] : tab === 'officials' ? ['Official Name', 'Department', 'Email', 'Phone', 'Status'] : tab === 'supervisors' ? ['Supervisor Name', 'Department', 'Email', 'Phone', 'Assigned Zone', 'Status'] : ['Name', 'Email', 'Phone', 'Department', 'Role', 'Status']}
                  templateName={`${tab}_template.csv`}
                />
              ) : tab === 'workers' ? (
                <div className="space-y-3">
                  <Field label="Name" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} />
                  <Field label="Role" value={form.role || ''} onChange={(v) => setForm({ ...form, role: v })} placeholder="e.g. Electrician, Cleaner" />
                  <Field label="Department" value={form.department || ''} onChange={(v) => setForm({ ...form, department: v })} />
                  <Field label="Phone" value={form.phone || ''} onChange={(v) => setForm({ ...form, phone: v })} />
                  <Field label="Availability" value={form.availability || 'Available'} onChange={(v) => setForm({ ...form, availability: v })} />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <Select
                      id="status"
                      value={form.status || 'ACTIVE'}
                      onChange={(value) => setForm({ ...form, status: value })}
                      options={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' },
                      ]}
                      placeholder="Select status"
                      size="sm"
                    />
                  </div>
                  <button onClick={saveWorker} className="btn-primary w-full">{editItem ? 'Update' : 'Add'} Worker</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Name" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} />
                  <Field label="Email" value={form.email || ''} onChange={(v) => setForm({ ...form, email: v })} />
                  {!editItem && <Field label="Password" value={form.password || ''} onChange={(v) => setForm({ ...form, password: v })} type="password" />}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <Select
                      id="role"
                      value={form.role || (tab === 'officials' ? 'OFFICIAL' : tab === 'supervisors' ? 'SUPERVISOR' : 'USER')}
                      onChange={(value) => setForm({ ...form, role: value })}
                      options={
                        tab === 'users'
                          ? [{ value: 'USER', label: 'User' }, { value: 'ADMIN', label: 'Admin' }]
                          : tab === 'officials'
                          ? [{ value: 'OFFICIAL', label: 'Official' }, { value: 'ADMIN', label: 'Admin' }]
                          : tab === 'supervisors'
                          ? [{ value: 'SUPERVISOR', label: 'Supervisor' }, { value: 'ADMIN', label: 'Admin' }]
                          : [{ value: 'USER', label: 'User' }, { value: 'ADMIN', label: 'Admin' }]
                      }
                      placeholder="Select role"
                      size="sm"
                    />
                  </div>
                  {editItem && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Status</label>
                      <Select
                        id="isActive"
                        value={form.isActive ? 'true' : 'false'}
                        onChange={(value) => setForm({ ...form, isActive: value === 'true' })}
                        options={[
                          { value: 'true', label: 'Active' },
                          { value: 'false', label: 'Inactive' },
                        ]}
                        placeholder="Select status"
                        size="sm"
                      />
                    </div>
                  )}
                  <button onClick={saveUser} className="btn-primary w-full">{editItem ? 'Update' : 'Add'} User</button>
                </div>
              )}
        </Modal>

      {confirmConfig && (
        <ConfirmDialog
          open={Boolean(confirmConfig)}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={confirmConfig.onCancel}
          confirmLabel="Yes, delete"
          cancelLabel="Cancel"
          intent="danger"
          sidePanel={false}
        />
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );
}

function Pagination({ count, page, onPageChange, pageSize = 8 }) {
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const start = Math.min((page - 1) * pageSize + 1, count);
  const end = Math.min(page * pageSize, count);

  return (
    <div className="table-pagination">
      <p className="text-xs sm:text-sm">{count === 0 ? 'No records to display.' : `Showing ${start}-${end} of ${count}`}</p>
      <div className="inline-flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="table-page-btn">Previous</button>
        <span className="text-xs text-slate-500">Page {page} of {pageCount}</span>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount} className="table-page-btn">Next</button>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card flex items-center gap-3 sm:gap-4">
      <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}><Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} /></div>
      <div className="min-w-0"><p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p></div>
    </div>
  );
}

function UserTable({ users, onEdit, onDelete, onExport }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const pageItems = users.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = pageItems.length > 0 && pageItems.every((u) => selected.includes(u.id));

  const toggleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !pageItems.some((u) => u.id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...pageItems.map((u) => u.id)])]);
    }
  };

  const selectedItems = users.filter((item) => selected.includes(item.id));

  useEffect(() => {
    if ((page - 1) * pageSize >= users.length && page > 1) {
      setPage(pageCount);
    }
  }, [users.length, page, pageCount]);

  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <label className="table-bulk">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="table-checkbox" />
            Select page
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">{selected.length} selected</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => onExport(selectedItems)} className="btn-secondary btn-xs gap-1"><Download className="h-3.5 w-3.5" />Export</button>
          <span className="text-xs text-slate-500 dark:text-slate-400">Showing {pageItems.length} of {users.length} users</span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block table-scroll">
        <table className="min-w-full text-sm">
          <thead className="table-heading">
            <tr>
              <th className="w-12"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="table-checkbox" /></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pageItems.map((u) => (
              <tr key={u.id} className="table-row">
                <td><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className="table-checkbox" /></td>
                <td className="font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                <td className="text-slate-600 dark:text-slate-300">{u.email}</td>
                <td><span className="badge bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200">{u.role}</span></td>
                <td><span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="text-slate-500 dark:text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  <button onClick={() => onEdit(u)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {pageItems.map((u) => (
          <div key={u.id} className="table-card-row">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className="table-checkbox shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(u)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="table-card-label">Role</p>
                <p className="table-card-value">{u.role}</p>
              </div>
              <div>
                <p className="table-card-label">Status</p>
                <p className="table-card-value">{u.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="table-card-label">Joined</p>
                <p className="table-card-value text-xs text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination count={users.length} page={page} onPageChange={setPage} pageSize={pageSize} />
    </div>
  );
}

function WorkerTable({ workers, onEdit, onDelete, onExport }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(workers.length / pageSize));
  const pageItems = workers.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = pageItems.length > 0 && pageItems.every((w) => selected.includes(w.id));

  const toggleSelect = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !pageItems.some((w) => w.id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...pageItems.map((w) => w.id)])]);
    }
  };
  const selectedItems = workers.filter((item) => selected.includes(item.id));

  useEffect(() => {
    if ((page - 1) * pageSize >= workers.length && page > 1) {
      setPage(pageCount);
    }
  }, [workers.length, page, pageCount]);

  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <label className="table-bulk">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="table-checkbox" />
            Select page
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">{selected.length} selected</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => onExport(selectedItems)} className="btn-secondary btn-xs gap-1"><Download className="h-3.5 w-3.5" />Export</button>
          <span className="text-xs text-slate-500 dark:text-slate-400">Showing {pageItems.length} of {workers.length} workers</span>
        </div>
      </div>

      <div className="hidden md:block table-scroll">
        <table className="min-w-full text-sm">
          <thead className="table-heading">
            <tr>
              <th className="w-12"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="table-checkbox" /></th>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Availability</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pageItems.map((w) => (
              <tr key={w.id} className="table-row">
                <td><input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggleSelect(w.id)} className="table-checkbox" /></td>
                <td className="font-medium text-slate-900 dark:text-slate-100">{w.name}</td>
                <td><span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{w.role}</span></td>
                <td className="text-slate-600 dark:text-slate-300">{w.department}</td>
                <td className="text-slate-600 dark:text-slate-300">{w.phone}</td>
                <td><span className={`badge ${w.availability === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{w.availability}</span></td>
                <td><span className={`badge ${w.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{w.status}</span></td>
                <td className="text-right">
                  <button onClick={() => onEdit(w)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(w.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {pageItems.map((w) => (
          <div key={w.id} className="table-card-row">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggleSelect(w.id)} className="table-checkbox shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{w.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{w.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(w)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(w.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <div><p className="table-card-label">Department</p><p className="table-card-value">{w.department}</p></div>
              <div><p className="table-card-label">Phone</p><p className="table-card-value">{w.phone}</p></div>
              <div><p className="table-card-label">Availability</p><p className="table-card-value">{w.availability}</p></div>
              <div><p className="table-card-label">Status</p><p className="table-card-value">{w.status}</p></div>
            </div>
          </div>
        ))}
      </div>

      <Pagination count={workers.length} page={page} onPageChange={setPage} pageSize={pageSize} />
    </div>
  );
}

function IssueTable({ issues, onDelete }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(issues.length / pageSize));
  const pageItems = issues.slice((page - 1) * pageSize, page * pageSize);
  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  };
  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    MEDIUM: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };

  useEffect(() => {
    if ((page - 1) * pageSize >= issues.length && page > 1) {
      setPage(pageCount);
    }
  }, [issues.length, page, pageCount]);

  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{issues.length} issues</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Filtered view with responsive cards on mobile.</span>
      </div>

      <div className="hidden md:block table-scroll">
        <table className="min-w-full text-sm">
          <thead className="table-heading">
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pageItems.map((i) => (
              <tr key={i.id} className="table-row">
                <td className="font-medium text-slate-900 dark:text-slate-100">{i.title}</td>
                <td className="text-slate-600 dark:text-slate-300">{i.category}</td>
                <td><span className={`badge ${priorityColors[i.priority]}`}>{i.priority}</span></td>
                <td><span className={`badge ${statusColors[i.status]}`}>{i.status.replace('_', ' ')}</span></td>
                <td className="text-slate-600 dark:text-slate-300">{i.reporter?.name || 'Unknown'}</td>
                <td className="text-slate-500 dark:text-slate-400 text-xs">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  <button onClick={() => navigate(`/issues/${i.id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400" title="Edit issue"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(i.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400" title="Delete issue"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {pageItems.map((i) => (
          <div key={i.id} className="table-card-row">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{i.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{i.category}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => navigate(`/issues/${i.id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400" title="Edit issue"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => onDelete(i.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400" title="Delete issue"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-1">
              <span className={`badge ${statusColors[i.status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{i.status.replace('_', ' ')}</span>
              <span className={`badge ${priorityColors[i.priority] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{i.priority}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="table-card-label">Reporter</p>
                <p className="table-card-value text-xs">{i.reporter?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="table-card-label">Date</p>
                <p className="table-card-value text-xs text-slate-500 dark:text-slate-400">{new Date(i.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination count={issues.length} page={page} onPageChange={setPage} pageSize={pageSize} />
    </div>
  );
}

function WebsiteIssueTable({ issues, onUpdate, onDelete }) {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(issues.length / pageSize));
  const pageItems = issues.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if ((page - 1) * pageSize >= issues.length && page > 1) {
      setPage(pageCount);
    }
  }, [issues.length, page, pageCount]);

  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{issues.length} website issues</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Simplified mobile cards with full desktop table support.</span>
      </div>

      <div className="hidden md:block table-scroll">
        <table className="min-w-full text-sm">
          <thead className="table-heading">
            <tr>
              <th>Title</th>
              <th>Reporter</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {pageItems.map((wi) => (
              <tr key={wi.id} className="table-row">
                <td>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{wi.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{wi.description}</p>
                </td>
                <td className="text-slate-600 dark:text-slate-300">{wi.reporterName}</td>
                <td><span className={`badge ${wi.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : wi.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{wi.priority}</span></td>
                <td>
                  <Select
                    id={`wi-status-${wi.id}`}
                    value={wi.status}
                    onChange={(value) => onUpdate(wi.id, value)}
                    options={[
                      { value: 'PENDING', label: 'Pending' },
                      { value: 'IN_REVIEW', label: 'In Review' },
                      { value: 'RESOLVED', label: 'Resolved' },
                    ]}
                    placeholder="Select status"
                    size="sm"
                  />
                </td>
                <td className="text-slate-500 dark:text-slate-400 text-xs">{new Date(wi.createdAt).toLocaleDateString()}</td>
                <td className="text-right">
                  <button onClick={() => onDelete(wi.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {pageItems.map((wi) => (
          <div key={wi.id} className="table-card-row">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{wi.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{wi.reporterName}</p>
              </div>
              <button onClick={() => onDelete(wi.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div><p className="table-card-label">Priority</p><p className="table-card-value">{wi.priority}</p></div>
              <div><p className="table-card-label">Status</p><p className="table-card-value">{wi.status.replace('_', ' ')}</p></div>
              <div><p className="table-card-label">Date</p><p className="table-card-value text-xs text-slate-500 dark:text-slate-400">{new Date(wi.createdAt).toLocaleDateString()}</p></div>
            </div>
          </div>
        ))}
      </div>

      <Pagination count={issues.length} page={page} onPageChange={setPage} pageSize={pageSize} />
    </div>
  );
}

function AnalyticsPanel({ analytics, categories }) {
  const total = analytics?.totalIssues || 0;
  const byPriority = analytics?.byPriority || [];
  const byCategory = analytics?.byCategory || [];
  return (
    <div className="responsive-grid-2">
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Issues by Priority</h3>
        {byPriority.map((p) => {
          const count = p._count.priority;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const barColor = p.priority === 'HIGH' ? 'bg-red-500' : p.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-gray-400 dark:bg-gray-500';
          return (
            <div key={p.priority} className="mb-2">
              <div className="flex justify-between text-xs"><span className="font-medium text-gray-700 dark:text-gray-300">{p.priority}</span><span className="text-gray-500 dark:text-gray-400">{count} ({pct}%)</span></div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700"><div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Issues by Category</h3>
        {byCategory.map((c) => {
          const count = c._count.category;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={c.category} className="mb-2">
              <div className="flex justify-between text-xs"><span className="font-medium text-gray-700 dark:text-gray-300">{c.category}</span><span className="text-gray-500 dark:text-gray-400">{count} ({pct}%)</span></div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700"><div className="h-2 rounded-full bg-primary-500" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SystemPanel() {
  return (
    <div className="responsive-grid-2">
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Platform Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400 shrink-0">Version</span><span className="font-medium text-gray-900 dark:text-white text-right">1.0.0</span></div>
          <div className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400 shrink-0">Environment</span><span className="font-medium text-gray-900 dark:text-white text-right">Development</span></div>
          <div className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400 shrink-0">Server</span><span className="font-medium text-gray-900 dark:text-white text-right">Node.js / Express</span></div>
          <div className="flex justify-between gap-2"><span className="text-gray-500 dark:text-gray-400 shrink-0">Frontend</span><span className="font-medium text-gray-900 dark:text-white text-right">React + Vite</span></div>
        </div>
      </div>
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Future Maintenance</h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>This section is reserved for future system controls:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li>Website settings management</li>
            <li>Error log monitoring</li>
            <li>Database maintenance</li>
            <li>Backup controls</li>
            <li>Feature flag management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}