import { Link } from 'react-router-dom';
import { ShareButton } from './ShareButton';

export function Footer() {
  return (
    <footer className="border-t border-white/6 bg-ink px-4 py-5">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 text-center">
        <ShareButton />

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-cream/30">
          <Link to="/terms" className="hover:text-cream/60 transition-colors">Termos de Uso</Link>
          <Link to="/privacy" className="hover:text-cream/60 transition-colors">Privacidade</Link>
          <Link to="/settings" className="hover:text-cream/60 transition-colors">Configurações</Link>
        </div>

        <p className="text-xs text-cream/20">
          Times reais · Jogadores fictícios · Sem afiliação com CBF, LFU ou LIBRA
        </p>
        <p className="text-xs text-cream/15">BRASFOOT Web · v0.5.0</p>
      </div>
    </footer>
  );
}
