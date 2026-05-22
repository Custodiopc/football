import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export function Lobby() {
  const { roomCode } = useParams<{ roomCode: string }>();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-4 text-center">
      <Clock className="text-gold/50" size={48} />
      <h1 className="font-retro text-4xl tracking-wide text-gold">Sala {roomCode}</h1>
      <p className="font-retro text-xl text-cream/60">Multiplayer P2P — Em breve!</p>
      <p className="max-w-xs text-sm text-cream/40">
        Esta funcionalidade chegará na Fase 3. Você precisará de um navegador atualizado com
        suporte a WebRTC.
      </p>
      <Link to="/" className="mt-4 text-sm text-gold/60 hover:text-gold transition-colors underline underline-offset-4">
        Voltar ao início
      </Link>
    </div>
  );
}
