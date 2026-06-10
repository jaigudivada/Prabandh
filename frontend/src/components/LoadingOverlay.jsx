export default function LoadingOverlay({ message = 'Loading…' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">{message}</p>
      </div>
    </div>
  );
}
