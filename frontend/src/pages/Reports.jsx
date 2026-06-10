import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import useRefresh from '../hooks/useRefresh';
import ConfirmDialog from '../components/ConfirmDialog';
import Select from '../components/Select';
import {
  TrendingUp, Activity, Users, Clock, BarChart3, AlertTriangle, CheckCircle,
  Download, Calendar, Search, Filter, User, HardHat, MapPin, Pencil, FileText,
  Trash2
} from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supervisors, setSupervisors] = useState([]);
  const [trends, setTrends] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Track if initial load has been done
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async (isBackground = false) => {
    // Only show loading on initial page load, not on background refreshes
    if (!initialLoadDone.current && !isBackground) {
      setLoading(true);
    }

    try {
      const [s, t, d, a, us, iss, cat] = await Promise.all([
        api.get('/api/analytics/supervisors'),
        api.get('/api/analytics/trends'),
        api.get('/api/analytics/departments'),
        api.get('/api/analytics'),
        api.get('/api/analytics/users'),
        api.get('/api/issues'),
        api.get('/api/categories'),
      ]);
      setSupervisors(s);
      setTrends(t);
      setDepartments(d);
      setAnalytics(a);
      setUserStats(us);
      setAllIssues(iss);
      setCategories(cat);
    } catch (err) { console.error(err); }

    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRefresh(loadData, 10000);

  const total = analytics?.totalIssues || 0;
  const resolved = analytics?.byStatus?.RESOLVED || 0;
  const pending = analytics?.byStatus?.PENDING || 0;
  const inProgress = analytics?.byStatus?.IN_PROGRESS || 0;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Filter issues for the detailed table
  const filteredIssues = allIssues.filter((issue) => {
    if (statusFilter && issue.status !== statusFilter) return false;
    if (categoryFilter && issue.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.location.toLowerCase().includes(q) ||
        issue.reporter?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const deleteIssue = async (id) => {
    setConfirmConfig({
      title: 'Delete issue',
      message: 'Are you sure you want to delete this issue? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/api/issues/${id}`);
          setConfirmConfig(null);
          await loadData();
        } catch (err) {
          setConfirmConfig(null);
          alert(err.message);
        }
      },
      onCancel: () => setConfirmConfig(null),
    });
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Category', 'Priority', 'Status', 'Location', 'Reporter', 'Assignee', 'Created', 'Updated'];
    const rows = filteredIssues.map((i) => [
      `"${i.title}"`,
      i.category,
      i.priority,
      i.status,
      `"${i.location}"`,
      i.reporter?.name || 'Unknown',
      i.assignee?.name || '-',
      new Date(i.createdAt).toLocaleDateString(),
      new Date(i.updatedAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'issues-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comprehensive analytics, trends, and issue tracking.</p>
        </div>
        <button onClick={exportToCSV} className="btn-secondary gap-2 text-xs"><Download className="h-4 w-4" />Export CSV</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-slate-700">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'trends', label: 'Trends', icon: TrendingUp },
          { id: 'supervisors', label: 'Supervisors', icon: Users },
          { id: 'departments', label: 'Departments', icon: HardHat },
          { id: 'users', label: 'User Activity', icon: User },
          { id: 'issues', label: 'All Issues', icon: FileText },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Activity} label="Total Issues" value={total} color="text-gray-700 dark:text-gray-300" bg="bg-white dark:bg-slate-950" />
            <MetricCard icon={CheckCircle} label="Resolved" value={resolved} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
            <MetricCard icon={AlertTriangle} label="Pending" value={pending} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
            <MetricCard icon={TrendingUp} label="Resolution Rate" value={`${resolutionRate}%`} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Issue Status Distribution</h2>
              <div className="space-y-4">
                {[
                  { label: 'Pending', count: pending, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', pct: total > 0 ? (pending / total) * 100 : 0 },
                  { label: 'In Progress', count: inProgress, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', pct: total > 0 ? (inProgress / total) * 100 : 0 },
                  { label: 'Resolved', count: resolved, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', pct: total > 0 ? (resolved / total) * 100 : 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className={item.textColor}>{item.count} ({Math.round(item.pct)}%)</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className={`h-3 rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Distribution</h2>
              <div className="space-y-4">
                {analytics?.byPriority?.map((item) => {
                  const count = item._count.priority;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const barColor = item.priority === 'HIGH' ? 'bg-red-500' : item.priority === 'MEDIUM' ? 'bg-orange-500' : 'bg-gray-400 dark:bg-gray-500';
                  const textColor = item.priority === 'HIGH' ? 'text-red-600 dark:text-red-400' : item.priority === 'MEDIUM' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400';
                  return (
                    <div key={item.priority}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.priority}</span>
                        <span className={textColor}>{count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div className={`h-3 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analytics?.byCategory?.map((item) => {
                const count = item._count.category;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={item.category} className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.category}</span>
                      <span className="text-2xl font-bold text-primary-600">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className="h-2 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pct}% of total</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resolution Rate</h2>
              <div className="flex items-end gap-4">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">{resolutionRate}%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">{resolved} resolved of {total} total</span>
              </div>
              <div className="mt-4 h-4 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className="h-4 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${resolutionRate}%` }} />
              </div>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolved}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p>
                </div>
                <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{userStats.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Users</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">30-Day Maintenance Trends</h2>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {trends.map((day) => {
              const maxVal = Math.max(day.total, 1);
              return (
                <div key={day.date} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 text-gray-500 dark:text-slate-400">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1">
                    <div className="flex h-6 items-center gap-0.5 rounded overflow-hidden">
                      {day.pending > 0 && (
                        <div className="h-full bg-amber-400 transition-all" style={{ width: `${(day.pending / maxVal) * 100}%` }} title={`Pending: ${day.pending}`} />
                      )}
                      {day.inProgress > 0 && (
                        <div className="h-full bg-blue-400 transition-all" style={{ width: `${(day.inProgress / maxVal) * 100}%` }} title={`In Progress: ${day.inProgress}`} />
                      )}
                      {day.resolved > 0 && (
                        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(day.resolved / maxVal) * 100}%` }} title={`Resolved: ${day.resolved}`} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-24 justify-end">
                    <span className="text-gray-600 dark:text-slate-300 font-medium">{day.total}</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-4">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Pending</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-400" />In Progress</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Resolved</span>
          </div>
        </div>
      )}

      {/* SUPERVISORS TAB */}
      {activeTab === 'supervisors' && (
        <div className="table-panel">
          <div className="table-toolbar">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Supervisor Performance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Detailed performance metrics for all supervisors.</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{supervisors.length} supervisors</span>
          </div>
          {supervisors.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 p-4">No supervisors found.</p>
          ) : (
            <>
              <div className="hidden md:block table-scroll">
                <table className="min-w-full text-sm">
                  <thead className="table-heading">
                    <tr>
                      <th>Supervisor</th>
                      <th>Assigned</th>
                      <th>Resolved</th>
                      <th>Pending</th>
                      <th>In Progress</th>
                      <th>Resolution Rate</th>
                      <th className="text-right">Avg Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {supervisors.map((s) => (
                      <tr key={s.id} className="table-row">
                        <td className="font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                        <td className="text-slate-600 dark:text-slate-300">{s.totalAssigned}</td>
                        <td className="text-emerald-600 dark:text-emerald-400 font-medium">{s.resolved}</td>
                        <td className="text-amber-600 dark:text-amber-400">{s.pending}</td>
                        <td className="text-blue-600 dark:text-blue-400">{s.inProgress}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div className="h-2 rounded-full bg-primary-500" style={{ width: `${s.resolutionRate}%` }} />
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400">{s.resolutionRate}%</span>
                          </div>
                        </td>
                        <td className="text-right text-slate-600 dark:text-slate-400">{s.avgResolutionTime > 0 ? `${s.avgResolutionTime}h` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3 p-3">
                {supervisors.map((s) => (
                  <div key={s.id} className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</span>
                      <span className={`badge ${s.resolutionRate >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.resolutionRate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Assigned:</span> <span className="font-medium">{s.totalAssigned}</span></div>
                      <div><span className="text-slate-500">Resolved:</span> <span className="font-medium text-emerald-600">{s.resolved}</span></div>
                      <div><span className="text-slate-500">Pending:</span> <span className="font-medium text-amber-600">{s.pending}</span></div>
                      <div><span className="text-slate-500">Avg Time:</span> <span className="font-medium">{s.avgResolutionTime > 0 ? `${s.avgResolutionTime}h` : '-'}</span></div>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${s.resolutionRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {departments.map((dept) => {
            const pct = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
            return (
              <div key={dept.category} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dept.category}</h3>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{dept.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2 text-center">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{dept.pending}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Pending</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2 text-center">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{dept.inProgress}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">In Progress</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2 text-center">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{dept.resolved}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Resolved</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-slate-400">Resolution Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dept.resolutionRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-slate-400">
                  <span>Avg resolution: {dept.avgResolutionTime > 0 ? `${dept.avgResolutionTime}h` : 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USER ACTIVITY TAB */}
      {activeTab === 'users' && (
        <div className="table-panel">
          <div className="table-toolbar">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Activity Report</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Issues reported and resolved by each user.</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{userStats.length} users</span>
          </div>
          {userStats.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 p-4">No user data available.</p>
          ) : (
            <>
              <div className="hidden md:block table-scroll">
                <table className="min-w-full text-sm">
                  <thead className="table-heading">
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Issues Reported</th>
                      <th>Resolved</th>
                      <th>Resolution Rate</th>
                      <th className="text-right">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {userStats.map((u) => {
                      const pct = total > 0 ? Math.round((u.reported / total) * 100) : 0;
                      return (
                        <tr key={u.id} className="table-row">
                          <td className="font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                          <td><span className="badge bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200">{u.role}</span></td>
                          <td className="text-slate-600 dark:text-slate-300">{u.reported}</td>
                          <td className="text-emerald-600 dark:text-emerald-400 font-medium">{u.resolved}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-2 rounded-full bg-primary-500" style={{ width: `${u.resolutionRate}%` }} />
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400">{u.resolutionRate}%</span>
                            </div>
                          </td>
                          <td className="text-right text-slate-600 dark:text-slate-400">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3 p-3">
                {userStats.map((u) => (
                  <div key={u.id} className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</span>
                      <span className="badge bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200 text-xs">{u.role}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Reported: <strong>{u.reported}</strong></span>
                      <span>Resolved: <strong className="text-emerald-600">{u.resolved}</strong></span>
                      <span>Rate: <strong>{u.resolutionRate}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ALL ISSUES TAB */}
      {activeTab === 'issues' && (
        <div className="table-panel">
          <div className="table-toolbar">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text" placeholder="Search issues..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 text-xs py-1.5 w-48"
                />
              </div>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'RESOLVED', label: 'Resolved' },
                ]}
                placeholder="Filter status"
                size="sm"
              />
              <Select
                id="category-filter"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c.value, label: c.name })),
                ]}
                placeholder="Filter category"
                size="sm"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{filteredIssues.length} issues</span>
          </div>

          {filteredIssues.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 p-4">No issues match the current filters.</p>
          ) : (
            <>
              <div className="hidden md:block table-scroll">
                <table className="min-w-full text-sm">
                  <thead className="table-heading">
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Reporter</th>
                      <th>Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id} className="table-row">
                        <td className="font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">{issue.title}</td>
                        <td className="text-slate-600 dark:text-slate-300">{categories.find((c) => c.value === issue.category)?.name || issue.category}</td>
                        <td>
                          <span className={`badge ${
                            issue.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            issue.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>{issue.priority}</span>
                        </td>
                        <td><span className={`badge ${statusColors[issue.status]}`}>{issue.status.replace('_', ' ')}</span></td>
                        <td className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[120px]">{issue.location}</td>
                        <td className="text-slate-600 dark:text-slate-300">{issue.reporter?.name || 'Unknown'}</td>
                        <td className="text-slate-500 dark:text-slate-400 text-xs">{new Date(issue.createdAt).toLocaleDateString()}</td>
                        <td className="text-right">
                          <button onClick={() => navigate(`/issues/${issue.id}`)} className="p-2 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400" title="Edit issue"><Pencil className="h-4 w-4" /></button>
                          {user?.role === 'ADMIN' && (
                            <button onClick={() => deleteIssue(issue.id)} className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400" title="Delete issue"><Trash2 className="h-4 w-4" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3 p-3">
                {filteredIssues.slice(0, 20).map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{issue.title}</span>
                      <span className={`badge ${statusColors[issue.status]} shrink-0`}>{issue.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{categories.find((c) => c.value === issue.category)?.name || issue.category}</span>
                        <span>·</span>
                        <span className={`font-medium ${
                          issue.priority === 'HIGH' ? 'text-red-600' : issue.priority === 'MEDIUM' ? 'text-orange-600' : 'text-gray-600'
                        }`}>{issue.priority}</span>
                        <span>·</span>
                        <span>{issue.reporter?.name || 'Unknown'}</span>
                        <span>·</span>
                        <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => navigate(`/issues/${issue.id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400" title="Edit issue"><Pencil className="h-3.5 w-3.5" /></button>
                        {user?.role === 'ADMIN' && (
                          <button onClick={() => deleteIssue(issue.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400" title="Delete issue"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
        />
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}