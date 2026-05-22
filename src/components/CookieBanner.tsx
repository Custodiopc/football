import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Pequeno delay para não bloquear LCP
    const timer = setTimeout(() => {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-ink-card shadow-2xl px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="flex-1 text-sm text-cream/70 leading-relaxed">
                Este site <strong className="text-cream">não usa cookies</strong> de rastreamento.
                Apenas armazenamos seu progresso localmente no seu navegador (IndexedDB).{' '}
                <Link to="/privacy" className="text-gold/70 underline underline-offset-2 hover:text-gold">
                  Saiba mais
                </Link>
              </p>
              <button
                onClick={accept}
                className="shrink-0 rounded-xl bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-light transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
