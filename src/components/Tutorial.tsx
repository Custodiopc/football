/**
 * Tutorial guiado simples — implementado com Tailwind + portals.
 * react-joyride v3 mudou a API; usar implementação própria é mais confiável.
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight } from 'lucide-react';

interface TutorialStep {
  selector: string | null;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'center';
}

const STEPS: TutorialStep[] = [
  { selector: null, title: 'Bem-vindo!', content: 'Vamos te mostrar o BRASFOOT em 4 passos rápidos. 🇧🇷', placement: 'center' },
  { selector: '[data-tour="solo-btn"]', title: 'Carreira Solo', content: 'Escolha um time e dispute o Brasileirão 2026 inteiro sozinho.', placement: 'bottom' },
  { selector: '[data-tour="multi-btn"]', title: 'Jogar com Amigos', content: 'Convide até 7 amigos — cada um controla um clube diferente via P2P!', placement: 'bottom' },
  { selector: '[data-tour="nickname"]', title: 'Seu Apelido', content: 'Aparece nos placares e conquistas. Você pode trocar quando quiser.', placement: 'top' },
];

interface TutorialProps {
  run: boolean;
  onDone: () => void;
}

export function Tutorial({ run, onDone }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];

  useEffect(() => {
    if (!run) return;
    setStep(0);
  }, [run]);

  useEffect(() => {
    if (!run || !current?.selector) { setRect(null); return; }
    const el = document.querySelector(current.selector);
    if (el) {
      setRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step, run, current?.selector]);

  if (!run) return null;

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onDone();
  };

  const isCenter = !current.selector || current.placement === 'center';

  const tooltipStyle = isCenter
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 340 }
    : rect
      ? {
          top: current.placement === 'bottom'
            ? rect.bottom + 12
            : rect.top - 12,
          left: Math.min(Math.max(rect.left + rect.width / 2 - 160, 12), window.innerWidth - 332),
          transform: current.placement === 'top' ? 'translateY(-100%)' : undefined,
          maxWidth: 320,
        }
      : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: 340 };

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {/* Overlay semi-transparente */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDone} />

      {/* Spotlight no elemento */}
      {rect && !isCenter && (
        <div
          className="absolute rounded-xl ring-2 ring-gold ring-offset-2 ring-offset-transparent pointer-events-none"
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
        />
      )}

      {/* Tooltip */}
      <div ref={boxRef} className="absolute z-10 w-80 rounded-2xl border border-white/15 bg-ink-card p-5 shadow-2xl" style={tooltipStyle}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-retro text-xl text-gold">{current.title}</h3>
          <button onClick={onDone} className="rounded-lg p-1 text-cream/40 hover:text-cream -mt-1 -mr-1">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-cream/80 leading-relaxed mb-4">{current.content}</p>
        <div className="flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={['h-1.5 rounded-full transition-all', i === step ? 'w-5 bg-gold' : 'w-1.5 bg-white/20'].join(' ')} />
            ))}
          </div>
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-light transition-colors"
          >
            {step < STEPS.length - 1 ? <><span>Próximo</span><ChevronRight size={14} /></> : <span>Pronto! 🚀</span>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
