import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4 text-center">
      <span className="font-retro text-8xl text-gold/30">404</span>
      <h1 className="font-retro text-3xl text-cream/70">Página não encontrada</h1>
      <p className="text-sm text-cream/40">O placar que você procura não existe.</p>
      <Link
        to="/"
        className="mt-4 rounded-xl border border-gold/30 px-5 py-2.5 font-body text-sm text-gold/70 transition-all hover:border-gold hover:text-gold"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
