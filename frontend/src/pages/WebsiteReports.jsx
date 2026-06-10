import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import useRefresh from '../hooks/useRefresh';
import { Bug, Trash2, Search } from 'lucide-react';
import Select from '../components/Select';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  IN_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export default function WebsiteReports() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async (isBackground = false) => {
    // Only show loading on initial page load
    if (!initialLoadDone.current && !isBackground) {
      setLoading(true);
    }
    try {
      const data = await api.get('/api/website-issues');
      setIssues(data);
    } catch (err) {
      console.error(err);
    }
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRefresh(loadData, 10000);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/website-issues/${id}`, { status });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteIssue = async (id) => {
    if (!confirm('Delete this website issue report?')) return;
    try {
      await api.delete(`/api/website-issues/${id}`);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredIssues = issues.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
    if (search && !item.title?.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Website Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View, filter, track, and manage website issue reports submitted by users.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="w-40">
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            placeholder="All Statuses"
            size="sm"
          />
        </div>
        <div className="w-40">
          <Select
            id="priority-filter"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={PRIORITY_OPTIONS}
            placeholder="All Priorities"
            size="sm"
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {filteredIssues.length} of {issues.length} reports
        </span>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bug className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No website reports found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {issues.length === 0
              ? 'No website issues have been reported yet.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="table-panel">
          {/* Desktop Table */}
          <div className="hidden md:block table-scroll">
            <table className="min-w-full text-sm">
              <thead className="table-heading">
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Reporter</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredIssues.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="font-medium text-slate-900 dark:text-slate-100">{item.title}</td>
                    <td className="text-slate-600 dark:text-slate-300 max-w-xs truncate">{item.description}</td>
                    <td className="text-slate-600 dark:text-slate-300">{item.reporterName}</td>
                    <td>
                      <span className={`badge ${item.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : item.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <Select
                        id={`status-${item.id}`}
                        value={item.status}
                        onChange={(value) => updateStatus(item.id, value)}
                        options={STATUS_OPTIONS}
                        placeholder="Select status"
                        size="sm"
                      />
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deleteIssue(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredIssues.map((item) => (
              <div key={item.id} className="table-card-row">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                  </div>
                  <button
                    onClick={() => deleteIssue(item.id)}
                    className="p-2 shrink-0 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 mt-3">
                  <div>
                    <p className="table-card-label">Reporter</p>
                    <p className="table-card-value">{item.reporterName}</p>
                  </div>
                  <div>
                    <p className="table-card-label">Priority</p>
                    <span className={`badge inline-block mt-1 ${item.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : item.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div>
                    <p className="table-card-label">Status</p>
                    <Select
                      id={`mobile-status-${item.id}`}
                      value={item.status}
                      onChange={(value) => updateStatus(item.id, value)}
                      options={STATUS_OPTIONS}
                      placeholder="Select status"
                      size="sm"
                    />
                  </div>
                  <div>
                    <p className="table-card-label">Date</p>
                    <p className="table-card-value text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}