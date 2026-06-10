export default function EmptyState({ icon: Icon, title = 'Nothing here yet', description = 'There is no data to show right now. Check back soon or adjust your filters.', action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="h-12 w-12 text-slate-400" />}
      <div className="space-y-2 text-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
