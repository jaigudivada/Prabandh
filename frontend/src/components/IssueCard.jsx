import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Briefcase } from 'lucide-react';

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-100',
  IN_PROGRESS: 'bg-cyan-50 text-cyan-800 border-cyan-100',
  RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-100',
};

const priorityStyles = {
  LOW: 'bg-slate-100 text-slate-700 border border-slate-200',
  MEDIUM: 'bg-orange-50 text-orange-800 border-orange-100',
  HIGH: 'bg-red-50 text-red-800 border-red-100',
};

export default function IssueCard({ issue, categoryName, assigneeLabel, canManageIssues }) {
  return (
    <article className="issue-card">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="issue-chip bg-slate-100 text-slate-700">{categoryName || issue.category}</span>
            <span className={`issue-chip ${statusStyles[issue.status]}`}>{issue.status.replace('_', ' ')}</span>
            <span className={`issue-chip ${priorityStyles[issue.priority]}`}>{issue.priority}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{issue.title}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{issue.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <MapPin className="h-3.5 w-3.5" />
            {issue.location}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <User className="h-3.5 w-3.5" />
            {issue.reporter?.name || 'Reporter'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(issue.createdAt).toLocaleDateString()}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <Briefcase className="h-3.5 w-3.5" />
            {assigneeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {issue.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{tag}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/issues/${issue.id}`} className="btn-secondary inline-flex items-center justify-center px-4 py-2 text-sm">
            View details
          </Link>
          {canManageIssues && (
            <Link to={`/issues/${issue.id}`} className="btn-primary inline-flex items-center justify-center px-4 py-2 text-sm">
              Manage
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
