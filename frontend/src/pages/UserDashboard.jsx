import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import IssueCard from '../components/IssueCard';
import useRefresh from '../hooks/useRefresh';
import { AlertTriangle, Clock, CheckCircle, Plus, Search, MapPin, Calendar, User, Eye, Briefcase, RefreshCw, ArrowUpCircle } from 'lucide-react';

const statusColors = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

const priorityColors = {
  LOW: 'bg-gray-50 text-gray-700 border border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  MEDIUM: 'bg-orange-50 text-orange-800 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  HIGH: 'bg-red-50 text-red-800 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString();
}

function getActivityGroup(date) {
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  return 'Older';
}

const statusIcons = {
  PENDING: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  IN_PROGRESS: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  RESOLVED: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const initialLoadDone = useRef(false);

  const refreshAll = useCallback((isBackground = false) => {
    loadIssues(isBackground);
    loadCategories(isBackground);
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);
  useRefresh(refreshAll, 10000);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'prabandh-data-update') {
        refreshAll();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshAll]);

  const loadCategories = async (isBackground = false) => {
    try { const data = await api.get('/api/categories'); setCategories(data); } catch (err) { console.error(err); }
  };

  const loadIssues = async (isBackground = false) => {
    if (!initialLoadDone.current && !isBackground) {
      setLoading(true);
    }
    try { const data = await api.get('/api/issues'); setIssues(data); } catch (err) { console.error(err); }
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  };

  const filtered = issues.filter((issue) => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.category && issue.category !== filters.category) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return issue.title.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q) || issue.location.toLowerCase().includes(q);
    }
    return true;
  });

  const categorySummary = categories.map((category) => ({
    name: category.name,
    value: category.value,
    count: issues.filter((issue) => issue.category === category.value).length,
  })).filter((item) => item.count > 0);

  const prioritySummary = ['LOW', 'MEDIUM', 'HIGH'].map((priority) => ({
    label: priority,
    count: issues.filter((issue) => issue.priority === priority).length,
  }));

  const recentActivity = [...issues]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === 'PENDING').length,
    inProgress: issues.filter((i) => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter((i) => i.status === 'RESOLVED').length,
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="skeleton-card h-32 sm:h-40" />
        <section className="responsive-grid-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="skeleton-card space-y-4 px-6 py-5">
              <div className="skeleton-line w-24" />
              <div className="space-y-3">
                <div className="skeleton-line" />
                <div className="skeleton-line w-3/4" />
              </div>
            </div>
          ))}
        </section>
        <section className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="skeleton-card h-64 sm:h-72" />
          <div className="space-y-4">
            <div className="skeleton-card h-28 sm:h-32" />
            <div className="skeleton-card h-28 sm:h-32" />
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="skeleton-card h-64 sm:h-72" />
          <div className="skeleton-card h-64 sm:h-72" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <header className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-emerald-600">Dashboard</p>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">My Issues</h1>
            <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm leading-6 text-slate-500 dark:text-slate-400">Welcome back, {user?.name}. Track your reported issues.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0">
            <Link to="/issues/new" className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
              <Plus className="h-4 w-4" />
              Report issue
            </Link>
          </div>
        </div>
      </header>

      {/* Stat cards - responsive grid */}
      <section className="responsive-grid-4">
        <StatCard icon={AlertTriangle} label="Total issues" value={stats.total} color="text-slate-700 dark:text-slate-300" bg="bg-slate-100 dark:bg-slate-800" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="text-amber-700 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
        <StatCard icon={Clock} label="In progress" value={stats.inProgress} color="text-sky-700 dark:text-sky-400" bg="bg-sky-50 dark:bg-sky-900/20" />
        <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved} color="text-emerald-700 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
      </section>

      {/* Main dashboard grid */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        {/* Issue health overview */}
        <div className="card">
          <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-emerald-600">Overview</p>
              <h2 className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-slate-950 dark:text-white">Issue health</h2>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              {filtered.length} visible issues
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Category breakdown</p>
              <div className="mt-3 sm:mt-4 space-y-3">
                {(categorySummary.length ? categorySummary : [{ name: 'No category data', count: 0 }]).map((item) => {
                  const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.name} className="space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="truncate">{item.name}</span>
                        <span className="shrink-0">{item.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Priority distribution</p>
              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                {prioritySummary.map((item) => {
                  const count = item.count;
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                  const badge = item.label === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : item.label === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge}`}>{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                        <div className={`h-2 rounded-full ${item.label === 'HIGH' ? 'bg-red-500' : item.label === 'MEDIUM' ? 'bg-orange-500' : 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions + Activity */}
        <div className="card space-y-4 sm:space-y-6">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-emerald-600">Quick actions</p>
                <h2 className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-slate-950 dark:text-white">Fast access</h2>
              </div>
              <div className="rounded-3xl bg-slate-100 px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">pro mode</div>
            </div>
            <div className="grid gap-2 sm:gap-3">
              <Link to="/issues/new" className="inline-flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900">
                <span>Log new issue</span>
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
              </Link>
              <button className="inline-flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900">
                <span>View latest reports</span>
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
              </button>
              <button className="inline-flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900">
                <span>Review pending items</span>
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 sm:pt-5 dark:border-slate-800">
            <div className="mb-3 sm:mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-emerald-600">Activity</p>
                <h2 className="mt-1 text-base sm:text-lg font-semibold text-slate-950 dark:text-white">Recent updates</h2>
              </div>
              <div className="rounded-3xl bg-slate-50 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-300 whitespace-nowrap">
                {recentActivity.length} items
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 sm:p-8 text-xs sm:text-sm dark:border-slate-700 dark:bg-slate-950">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">No recent activity to display yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">When issues are reported, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[300px] sm:max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {(() => {
                  const groups = {};
                  recentActivity.forEach((issue) => {
                    const group = getActivityGroup(issue.createdAt);
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(issue);
                  });
                  const groupOrder = ['Today', 'Yesterday', 'This week', 'Older'];
                  return groupOrder
                    .filter((g) => groups[g]?.length)
                    .map((group) => (
                      <div key={group}>
                        <div className="flex items-center gap-2 px-1 py-1 sm:py-1.5">
                          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{group}</span>
                          <div className="flex-1 border-t border-slate-100 dark:border-slate-800" />
                        </div>
                        <div className="space-y-1 sm:space-y-1.5">
                          {groups[group].map((issue) => {
                            const StatusIcon = statusIcons[issue.status]?.icon || ArrowUpCircle;
                            const iconColor = statusIcons[issue.status]?.color || 'text-slate-400';
                            const iconBg = statusIcons[issue.status]?.bg || 'bg-slate-100 dark:bg-slate-800';
                            return (
                              <Link
                                to={`/issues/${issue.id}`}
                                key={issue.id}
                                className="group block rounded-2xl border border-slate-100 bg-white p-2 sm:p-3 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                              >
                                <div className="flex items-start gap-2 sm:gap-2.5">
                                  <div className={`mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                                    <StatusIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${iconColor}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 truncate">{issue.title}</p>
                                      <span className="shrink-0 text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500">{timeAgo(issue.createdAt)}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-1">
                                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{issue.category}</span>
                                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${statusColors[issue.status]}`}>{issue.status.replace('_', ' ')}</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Issue list table section */}
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_25px_70px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 sm:mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-emerald-600">Issue list</p>
            <h2 className="mt-1 sm:mt-2 text-lg sm:text-xl font-semibold text-slate-950 dark:text-white">Recent issues</h2>
          </div>
          <div className="rounded-3xl bg-slate-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300 whitespace-nowrap">
            Showing {filtered.length} of {stats.total}
          </div>
        </div>

        {/* Mobile: stacked cards */}
        <div className="space-y-3 sm:space-y-4 md:hidden">
          {filtered.slice(0, 7).map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              categoryName={categories.find((c) => c.value === issue.category)?.name}
              assigneeLabel={'-'}
              canManageIssues={false}
            />
          ))}
        </div>

        {/* Tablet+: full table */}
        <div className="hidden md:block overflow-x-auto rounded-[24px] border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 sm:px-4 py-3">Issue</th>
                <th className="px-3 sm:px-4 py-3">Status</th>
                <th className="px-3 sm:px-4 py-3">Priority</th>
                <th className="px-3 sm:px-4 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.slice(0, 7).map((issue) => (
                <tr key={issue.id} className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-slate-900 dark:text-slate-100">
                    <Link to={`/issues/${issue.id}`} className="font-medium hover:text-primary-700">{issue.title}</Link>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{issue.description}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4">
                    <span className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold ${statusColors[issue.status]}`}>{issue.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4">
                    <span className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-slate-600 dark:text-slate-300">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card flex items-center gap-3 sm:gap-4">
      <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
      </div>
    </div>
  );
}