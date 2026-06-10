import { X } from 'lucide-react';

export default function Modal({ open, title, subtitle, children, footer, onClose, hideClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}> 
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            {title && <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {!hideClose && (
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
