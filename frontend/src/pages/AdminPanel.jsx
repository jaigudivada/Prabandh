import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useRefresh from '../hooks/useRefresh';
import { Users, Shield, User as UserIcon, Briefcase, BarChart3, TrendingUp, Activity, Tag, Lock, Unlock } from 'lucide-react';
import Select from '../components/Select';

const roleIcons = { ADMIN: Shield, SUPERVISOR: Briefcase, OFFICIAL: Briefcase, USER: UserIcon };
const roleColors = { ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', SUPERVISOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', OFFICIAL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', USER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };

export default function AdminPanel({ initialTab }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [newCategory, setNewCategory] = useState({ name: '', value: '' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab || 'users');
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async (isBackground = false) => {
    if (!initialLoadDone.current && !isBackground) {
      setLoading(true);
    }
    try {
      const [u, a, c, p] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/analytics'),
        api.get('/api/categories'),
        api.get('/api/permissions'),
      ]);
      setUsers(u);
      setAnalytics(a);
      setCategoriesList(c);
      setPermissions(p);
    } catch (err) { console.error(err); }
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRefresh(loadData, 10000);

  const changeRole = async (id, role) => {
    try { await api.patch(`/api/users/${id}/role`, { role }); loadData(); } catch (err) { alert(err.message); }
  };

  const toggleActive = async (id, isActive) => {
    try { await api.patch(`/api/users/${id}/active`, { isActive }); loadData(); } catch (err) { alert(err.message); }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try { await api.post('/api/categories', newCategory); setNewCategory({ name: '', value: '' }); loadData(); } catch (err) { alert(err.message); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/api/categories/${id}`); loadData(); } catch (err) { alert(err.message); }
  };

  const updatePermission = async (role, key, value) => {
    try {
      const updated = { ...permissions[role], [key]: value };
      await api.patch(`/api/permissions/${role}`, updated);
      loadData();
    } catch (err) { alert(err.message); }
  };

  if (user?.role !== 'ADMIN') {
    return <div className="text-center py-20"><p className="text-gray-500 dark:text-gray-400">You don't have permission to view this page.</p></div>;
  }

  const total = analytics?.totalIssues || 0;
  const resolved = analytics?.byStatus?.RESOLVED || 0;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage users and view system analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Activity} label="Total Issues" value={total} color="text-gray-700 dark:text-gray-300" bg="bg-white dark:bg-slate-800" />
        <MetricCard icon={TrendingUp} label="Resolved" value={resolved} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <MetricCard icon={BarChart3} label="Pending" value={analytics?.byStatus?.PENDING || 0} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
        <MetricCard icon={TrendingUp} label="Resolution Rate" value={`${resolutionRate}%`} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
        {loading ? (
          <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4 pt-2">Name</th>
                  <th className="pb-3 pr-4 pt-2">Email</th>
                  <th className="pb-3 pr-4 pt-2">Role</th>
                  <th className="pb-3 pr-4 pt-2">Joined</th>
                  <th className="pb-3 pt-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((u) => {
                  const Icon = roleIcons[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className={`font-medium text-gray-900 dark:text-gray-100 ${!u.isActive ? 'line-through opacity-50' : ''}`}>{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${roleColors[u.role]}`}><Icon className="mr-1 h-3 w-3" />{u.role}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Select
                            id={`role-${u.id}`}
                            value={u.role}
                            onChange={(value) => changeRole(u.id, value)}
                            options={[
                              { value: 'USER', label: 'USER' },
                              { value: 'SUPERVISOR', label: 'SUPERVISOR' },
                              { value: 'OFFICIAL', label: 'OFFICIAL' },
                              { value: 'ADMIN', label: 'ADMIN' },
                            ]}
                            placeholder="Select role"
                            size="sm"
                          />
                          <button onClick={() => toggleActive(u.id, !u.isActive)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title={u.isActive ? 'Deactivate' : 'Activate'}>
                            {u.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Issues by Category</h2>
          <div className="space-y-3">
            {analytics?.byCategory?.map((item) => {
              const count = item._count.category;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={item.category}>
                  <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">{item.category}</span><span className="text-gray-500 dark:text-gray-400">{count} ({pct}%)</span></div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700"><div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Issues by Priority</h2>
          <div className="space-y-3">
            {analytics?.byPriority?.map((item) => {
              const count = item._count.priority;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const color = item.priority === 'HIGH' ? 'bg-red-500' : item.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-gray-400 dark:bg-gray-500';
              return (
                <div key={item.priority}>
                  <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">{item.priority}</span><span className="text-gray-500 dark:text-gray-400">{count} ({pct}%)</span></div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700"><div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Category Management</h2>
          <form onSubmit={addCategory} className="mb-4 flex gap-2">
            <input type="text" placeholder="Display name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="input-field text-xs flex-1" required />
            <input type="text" placeholder="Value (e.g. WIFI)" value={newCategory.value} onChange={(e) => setNewCategory({ ...newCategory, value: e.target.value })} className="input-field text-xs flex-1" required />
            <button type="submit" className="btn-primary text-xs px-3 py-1.5">Add</button>
          </form>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categoriesList.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">({cat.value})</span>
                </div>
                <button onClick={() => deleteCategory(cat.id)} className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Access Permissions</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {Object.entries(permissions).map(([role, perms]) => (
              <div key={role} className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{role}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(perms).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={val} onChange={(e) => updatePermission(role, key, e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600" />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}><Icon className={`h-5 w-5 ${color}`} /></div>
      <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p></div>
    </div>
  );
}
