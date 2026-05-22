import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  persistent?: boolean;
  className?: string;
}

export function Modal({ open, onClose, title, children, persistent = false, className = '' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, persistent]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (!persistent && e.target === overlayRef.current) onClose?.(); }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,30,53,0.85)', backdropFilter: 'blur(4px)' }} />
      <div
        className={['relative z-10 w-full max-w-md rounded-xl shadow-2xl', className].join(' ')}
        style={{ backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}
      >
        {(title || (!persistent && onClose)) && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1e3a5c' }}>
            {title && (
              <h2 className="font-retro text-xl tracking-wide" style={{ color: '#f5d020' }}>{title}</h2>
            )}
            {!persistent && onClose && (
              <button onClick={onClose} className="ml-auto rounded p-1 transition-colors" style={{ color: '#6b7c93' }}>
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
