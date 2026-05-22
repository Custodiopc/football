import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENT_DEFS } from '../lib/feedback';
import type { AchievementId } from '../lib/storage';

interface AchievementToastProps {
  achievementId: AchievementId | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievementId, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (!achievementId) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [achievementId, onDismiss]);

  const def = achievementId ? ACHIEVEMENT_DEFS[achievementId] : null;

  return (
    <AnimatePresence>
      {def && (
        <motion.div
          key={achievementId}
          initial={{ opacity: 0, y: -60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onDismiss}
          className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 cursor-pointer"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-ink-card px-5 py-3 shadow-2xl shadow-gold/20">
            <span className="text-2xl">{def.icon}</span>
            <div>
              <p className="text-xs uppercase tracking-widest text-gold/70">Conquista desbloqueada!</p>
              <p className="font-retro text-xl text-gold">{def.label}</p>
              <p className="text-xs text-cream/50">{def.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
