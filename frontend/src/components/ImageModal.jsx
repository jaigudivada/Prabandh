import { useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageModal({ src, alt, onClose }) {
  const handleEsc = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [handleEsc]);

  const handleZoom = (factor) => {
    const img = document.getElementById('modal-image');
    if (img) {
      const current = parseFloat(img.style.transform?.replace('scale(', '').replace(')', '') || '1');
      const next = Math.max(0.5, Math.min(4, current * factor));
      img.style.transform = `scale(${next})`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col items-center w-full max-w-[95vw] max-h-[95vh]">
        <div className="relative w-full max-w-[95vw]">
          {/* Image container */}
          <div className="overflow-auto rounded-lg max-h-[90vh] max-w-[95vw] flex items-center justify-center">
            <img
              id="modal-image"
              src={src}
              alt={alt || ''}
              className="max-h-[90vh] max-w-[95vw] object-contain transition-transform select-none"
              style={{ transform: 'scale(1)' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Close button — top-right overlay */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 rounded-xl bg-black/50 p-2.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
            title="Close (ESC)"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Zoom controls — bottom-center overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl bg-black/50 px-3 py-2 backdrop-blur-sm">
            <button onClick={() => handleZoom(1.25)} className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors" title="Zoom in">
              <ZoomIn className="h-5 w-5" />
            </button>
            <span className="h-5 w-px bg-white/20" />
            <button onClick={() => handleZoom(0.8)} className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors" title="Zoom out">
              <ZoomOut className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/60">Press ESC or click outside to close</p>
      </div>
    </div>
  );
}
