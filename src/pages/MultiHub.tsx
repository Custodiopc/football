import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';

export function MultiHub() {
  const navigate = useNavigate();
  const [joinModal, setJoinModal] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [err, setErr] = useState('');

  const handleJoin = () => {
    const code = roomInput.trim().toUpperCase();
    if (!/^[A-Z]{3}-[A-Z]{3}$/.test(code)) {
      setErr('Formato inválido. Use o formato: ABC-XYZ');
      return;
    }
    navigate(`/multi/join/${code}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <Users size={40} className="mx-auto mb-3 text-gold/60" />
          <h1 className="font-retro text-4xl tracking-wide text-gold">Jogar com Amigos</h1>
          <p className="mt-1 text-sm text-cream/50">Até 8 jogadores, cada um no seu time</p>
        </div>

        {/* Aviso importante */}
        <Card className="flex gap-3 p-4 border-yellow-600/30 bg-yellow-950/20">
          <AlertTriangle size={18} className="shrink-0 text-yellow-400 mt-0.5" />
          <p className="text-sm text-yellow-200/80">
            Salas são temporárias. Se o anfitrião fechar o navegador, o jogo acaba para todos.
          </p>
        </Card>

        {/* Botões */}
        <div className="flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={() => navigate('/multi/host')}>
            <Users size={20} />
            Criar Sala
          </Button>
          <Button size="lg" fullWidth variant="secondary" onClick={() => setJoinModal(true)}>
            <ArrowRight size={20} />
            Entrar com Código
          </Button>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-1.5 text-sm text-cream/40 hover:text-cream transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      {/* Modal de código */}
      <Modal open={joinModal} onClose={() => { setJoinModal(false); setErr(''); }} title="Entrar em sala">
        <p className="mb-4 text-sm text-cream/60">
          Digite o código de 6 letras que o anfitrião compartilhou.
        </p>
        <input
          type="text"
          value={roomInput}
          onChange={(e) => { setRoomInput(e.target.value.toUpperCase()); setErr(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="ABC-XYZ"
          maxLength={7}
          className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-center font-retro text-3xl tracking-widest text-gold placeholder-cream/20 outline-none focus:border-gold/40"
        />
        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
        <div className="mt-4 flex gap-3">
          <Button fullWidth variant="secondary" onClick={() => { setJoinModal(false); setErr(''); }}>
            Cancelar
          </Button>
          <Button fullWidth onClick={handleJoin}>
            Entrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
