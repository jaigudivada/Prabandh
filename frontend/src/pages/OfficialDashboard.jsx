import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import useRefresh from '../hooks/useRefresh';
import { Bug, Plus, X, Eye, BarChart3 } from 'lucide-react';
import Select from '../components/Select';

export default function OfficialDashboard() {
  const { user } = useAuth();
  const [websiteIssues, setWebsiteIssues] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [reportFile, setReportFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async (isBackground = false) => {
    if (!initialLoadDone.current && !isBackground) {
      setLoading(true);
    }
    try {
      const wi = await api.get('/api/website-issues');
      setWebsiteIssues(wi);
    } catch (err) { console.error(err); }
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRefresh(loadData, 10000);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'prabandh-data-update') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadData]);

  const submitWebsiteIssue = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', reportForm.title);
      formData.append('description', reportForm.description);
      formData.append('priority', reportForm.priority);
      if (reportFile) formData.append('screenshots', reportFile);
      await api.post('/api/website-issues', formData);
      setReportForm({ title: '', description: '', priority: 'MEDIUM' });
      setReportFile(null);
      setShowReportForm(false);
      loadData();
    } catch (err) { alert(err.message); }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title">Official Dashboard</h1>
          <p className="page-subtitle">Report bugs or issues found on the website.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowReportForm(true)} className="btn-primary gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" />New Report</button>
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-medium">Read-Only</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">My Website Issue Reports</h2>
        {websiteIssues.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No website issues reported yet.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-[24px] border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {websiteIssues.map((wi) => (
                    <tr key={wi.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{wi.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{wi.description}</p>
                      </td>
                      <td className="px-3 py-3"><span className={`badge ${wi.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : wi.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' : 'bg-gray-50 text-gray-700 border border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}>{wi.priority}</span></td>
                      <td className="px-3 py-3"><span className={`badge ${wi.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' : wi.status === 'IN_REVIEW' ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'}`}>{wi.status.replace('_', ' ')}</span></td>
                      <td className="px-3 py-3 text-gray-500 dark:text-slate-400 text-xs">{new Date(wi.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {websiteIssues.map((wi) => (
                <div key={wi.id} className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{wi.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">{wi.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`badge ${wi.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : wi.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' : 'bg-gray-50 text-gray-700 border border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}`}>{wi.priority}</span>
                    <span className={`badge ${wi.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' : wi.status === 'IN_REVIEW' ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'}`}>{wi.status.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(wi.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showReportForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:py-8"
          onClick={(e) => e.target === e.currentTarget && setShowReportForm(false)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-t-[24px] sm:rounded-[24px] shadow-lg w-full max-w-lg mx-auto transform transition-all duration-200 ease-out max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 px-5 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Website Issue</h3>
              <button onClick={() => setShowReportForm(false)} className="rounded-2xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitWebsiteIssue} className="px-5 py-4 sm:px-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title</label>
                <input type="text" required value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} className="input-field" placeholder="e.g. Login page not loading" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea required rows={3} value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} className="input-field" placeholder="Describe the issue..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <Select
                  id="priority"
                  value={reportForm.priority}
                  onChange={(value) => setReportForm({ ...reportForm, priority: value })}
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                  ]}
                  placeholder="Select priority"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Screenshot (optional)</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={(e) => setReportFile(e.target.files[0] || null)} className="text-xs w-full" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}