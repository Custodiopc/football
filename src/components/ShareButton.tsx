import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: 'icon' | 'full';
}

export function ShareButton({
  url = window.location.href,
  title = 'BRASFOOT — Gerenciador de Futebol Brasileiro',
  text = 'Jogue o Brasileirão 2026! Solo ou com até 8 amigos, grátis e sem login.',
  className = '',
  variant = 'full',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Web Share API (mobile nativo)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // usuário cancelou ou não suportado
      }
    }

    // Fallback: copiar link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback final: prompt
      window.prompt('Copie o link:', url);
    }
  };

  if (variant === 'icon') {
    return (
      <button onClick={handleShare} className={['rounded-xl p-2 text-cream/50 hover:text-cream hover:bg-white/5 transition-colors', className].join(' ')}>
        {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={[
        'flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-cream/70 transition-all hover:border-gold/30 hover:text-cream',
        className,
      ].join(' ')}
    >
      {copied
        ? <><Check size={16} className="text-green-400" /> Link copiado!</>
        : <><Share2 size={16} /> Compartilhar</>
      }
    </button>
  );
}
