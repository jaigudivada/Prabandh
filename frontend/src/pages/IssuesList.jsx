import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import useRefresh from '../hooks/useRefresh';
import { Search, MapPin } from 'lucide-react';
import Select from '../components/Select';

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

export default function IssuesList() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async (isBackground = false) => {
    if (!initialLoadDone.current && !isBackground) {
      setLoading(true);
    }
    try {
      const [iss, cats] = await Promise.all([
        api.get('/api/issues'),
        api.get('/api/categories'),
      ]);
      setIssues(iss);
      setCategories(cats);
    } catch (err) { console.error(err); }
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRefresh(loadData, 10000);

  const filtered = issues.filter((issue) => {
    if (statusFilter && issue.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return issue.title.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q) || issue.location.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-title">Issues</h1>
        <p className="page-subtitle">Browse and search all reported issues.</p>
      </div>

      {/* Responsive filter bar */}
      <div className="filter-bar">
        <div className="relative filter-search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text" placeholder="Search issues..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <div className="w-full sm:w-44">
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
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{filtered.length} issues</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-8 sm:py-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No issues found.</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Desktop table - hidden on mobile */}
          <div className="hidden md:block table-scroll">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="table-heading">
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((issue) => (
                  <tr key={issue.id} className="table-row">
                    <td className="font-medium">
                      <Link to={`/issues/${issue.id}`} className="text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400">
                        {issue.title}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{issue.description}</p>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {categories.find((c) => c.value === issue.category)?.name || issue.category}
                    </td>
                    <td><span className={`badge ${priorityColors[issue.priority]}`}>{issue.priority}</span></td>
                    <td><span className={`badge ${statusColors[issue.status]}`}>{issue.status.replace('_', ' ')}</span></td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{issue.location}</td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{new Date(issue.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {filtered.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="block rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{issue.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{issue.description}</p>
                  </div>
                  <span className={`badge shrink-0 ${statusColors[issue.status]}`}>{issue.status.replace('_', ' ')}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`badge ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {categories.find((c) => c.value === issue.category)?.name || issue.category}
                  </span>
                  {issue.location && (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {issue.location}
                    </span>
                  )}
                  <span className="text-slate-400 ml-auto">{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}