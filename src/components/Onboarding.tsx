import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { Button } from './Button';

interface OnboardingProps {
  onDone: () => void;
}

const SLIDES = [
  {
    emoji: '🏆',
    title: 'Gerencie seu time',
    body: 'Escale jogadores, defina táticas e dispute o Brasileirão Série A 2026 de ponta a ponta.',
  },
  {
    emoji: '👥',
    title: 'Solo ou com amigos',
    body: 'Jogue sua carreira sozinho ou convide até 7 amigos para cada um controlar um clube diferente.',
  },
  {
    emoji: '🔓',
    title: '100% gratuito, sem login',
    body: 'Sem cadastro, sem anúncios, sem dados na nuvem. Tudo fica no seu navegador.',
  },
];

export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else onDone();
  };

  const slide = SLIDES[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm">
        {/* Skip */}
        <button
          onClick={onDone}
          className="absolute -top-10 right-0 flex items-center gap-1 text-sm text-cream/40 hover:text-cream transition-colors"
        >
          <X size={14} /> Pular
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-white/10 bg-ink-card p-8 text-center"
          >
            <div className="mb-4 text-6xl">{slide.emoji}</div>
            <h2 className="font-retro text-3xl tracking-wide text-gold mb-3">{slide.title}</h2>
            <p className="text-cream/70 leading-relaxed">{slide.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={['h-2 rounded-full transition-all', i === step ? 'w-6 bg-gold' : 'w-2 bg-white/20'].join(' ')}
            />
          ))}
        </div>

        <div className="mt-4">
          <Button fullWidth size="lg" onClick={next}>
            {step < SLIDES.length - 1 ? (
              <><ArrowRight size={18} /> Próximo</>
            ) : (
              '🚀 Começar a jogar!'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
