import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ArrowLeft, MapPin, Calendar, User, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import ImageModal from '../components/ImageModal';
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

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => { loadIssue(); loadCategories(); }, [id]);

  const loadCategories = async () => {
    try { const data = await api.get('/api/categories'); setCategories(data); } catch (err) { console.error(err); }
  };

  const loadIssue = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/issues/${id}`);
      setIssue(data);
      if (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') {
        const w = await api.get('/api/workers');
        setWorkers(w);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status) => {
    setUpdating(true);
    try { const updated = await api.patch(`/api/issues/${id}`, { status }); setIssue(updated); } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const updatePriority = async (priority) => {
    setUpdating(true);
    try { const updated = await api.patch(`/api/issues/${id}`, { priority }); setIssue(updated); } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const assignWorker = async (workerId) => {
    setUpdating(true);
    try { const updated = await api.patch(`/api/issues/${id}`, { assigneeId: workerId || null }); setIssue(updated); } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  if (!issue) return <div className="text-center py-20"><p className="text-gray-500 dark:text-gray-400">Issue not found</p><Link to="/" className="mt-2 inline-block text-primary-600 hover:underline">Back to dashboard</Link></div>;

  const canUpdateStatus = ['SUPERVISOR', 'ADMIN'].includes(user.role);
  const canChangePriority = user.role === 'ADMIN';
  const canAssign = ['SUPERVISOR', 'ADMIN'].includes(user.role);

  const currentAssigneeLabel = () => {
    const worker = workers.find((w) => w.id === issue.assigneeId);
    if (worker) return `${worker.role} - ${worker.name}`;
    if (issue.assignee?.role) return `${issue.assignee.role} - ${issue.assignee.name}`;
    return issue.assignee?.name || 'Unassigned';
  };

  return (
    <>
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <Link
        to="/"
        className="mb-5 sm:mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to issues</span>
      </Link>

      <div className="card !p-4 sm:!p-6 lg:!p-8">
        {/* ── HEADER SECTION ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white break-words">
                {issue.title}
              </h1>
              {issue.isAnonymous && (
                <span className="badge bg-purple-50 text-purple-800 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 shrink-0 mt-0.5">
                  Anonymous
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {new Date(issue.createdAt).toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5 break-all">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {issue.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0" />
                {issue.reporter?.name || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start">
            <span className={`badge border ${statusColors[issue.status]}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className={`badge ${priorityColors[issue.priority]}`}>
              {issue.priority}
            </span>
          </div>
        </div>

        {/* ── BODY: MAIN + SIDEBAR ── */}
        <div className="mt-6 lg:mt-8 flex flex-col gap-6 lg:flex-row">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-6 lg:space-y-8">
            {/* ── DESCRIPTION ── */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Description
              </h3>
              <div className="mt-2 sm:mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words overflow-wrap-break-word [overflow-wrap:break-word] [word-break:break-word] [hyphens:auto]">
                {issue.description}
              </div>
            </div>

            {/* ── ATTACHMENTS ── */}
            {issue.attachments?.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Attachments
                </h3>
                <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {issue.attachments.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setPreviewImage({ src: att.filepath, alt: att.filename })}
                      className="group relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-pointer aspect-[4/3]"
                    >
                      <img
                        src={att.filepath}
                        alt={att.filename}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR DETAILS ── */}
          <div className="w-full shrink-0 space-y-4 lg:w-80 xl:w-96">
            {/* Metadata card */}
            <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Details
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">Category</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%] sm:max-w-[65%]">
                    {categories.find((c) => c.value === issue.category)?.name || issue.category}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">Priority</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{issue.priority}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">Status</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{issue.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">Reporter</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%] sm:max-w-[65%]">
                    {issue.reporter?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">Assignee</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 text-right break-words max-w-[60%] sm:max-w-[65%]">
                    {currentAssigneeLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* Assign Worker card */}
            {canAssign && (
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Assign Worker</h3>
                <div className="mt-3">
                  <Select
                    id="assignee"
                    value={issue.assigneeId || ''}
                    onChange={assignWorker}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...workers.map((w) => ({
                        value: w.id,
                        label: `${w.role} - ${w.name}`,
                      })),
                    ]}
                    placeholder="Select worker"
                    disabled={updating}
                  />
                </div>
              </div>
            )}

            {/* Change Priority card */}
            {canChangePriority && (
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Priority</h3>
                <div className="mt-3">
                  <Select
                    id="priority"
                    value={issue.priority}
                    onChange={updatePriority}
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                    ]}
                    placeholder="Select priority"
                    disabled={updating}
                  />
                </div>
              </div>
            )}

            {/* Update Status card */}
            {canUpdateStatus && (
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Update Status</h3>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => updateStatus('PENDING')}
                    disabled={updating || issue.status === 'PENDING'}
                    className="btn-secondary text-left text-xs disabled:opacity-50"
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    Mark as Pending
                  </button>
                  <button
                    onClick={() => updateStatus('IN_PROGRESS')}
                    disabled={updating || issue.status === 'IN_PROGRESS'}
                    className="btn-secondary text-left text-xs disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Mark as In Progress
                  </button>
                  <button
                    onClick={() => updateStatus('RESOLVED')}
                    disabled={updating || issue.status === 'RESOLVED'}
                    className="btn-secondary text-left text-xs disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Mark as Resolved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      {previewImage && <ImageModal src={previewImage.src} alt={previewImage.alt} onClose={() => setPreviewImage(null)} />}
    </>
  );
}