import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Users, Play, AlertTriangle, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { useMultiStore } from '../stores/multiStore';
import { SEOHead } from '../components/SEOHead';
import { useSettingsStore } from '../stores/settingsStore';
import { TEAMS, getTeamById } from '../data';
import type { Difficulty } from '../types';

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy',   label: '🟢 Fácil' },
  { key: 'normal', label: '🟡 Normal' },
  { key: 'hard',   label: '🔴 Difícil' },
];

export function MultiHost() {
  const navigate = useNavigate();
  const nickname = useSettingsStore((s) => s.nickname) ?? '';
  const { hostCreateRoom, hostStartGame, hostKickPlayer, leaveRoom, career, roomCode } = useMultiStore();

  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [hostTeam, setHostTeam] = useState<number | null>(null);

  // Aviso ao fechar aba
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (career) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [career]);

  const handleCreate = async () => {
    if (!nickname) return;
    setLoading(true);
    try {
      await hostCreateRoom(nickname, difficulty);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    hostStartGame();
    navigate(`/multi/game/${roomCode}`);
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/multi');
  };

  const shareUrl = roomCode ? `${window.location.origin}/multi/join/${roomCode}` : '';
  const players = career?.players ?? [];
  const allChosen = players.length >= 2 && players.every((p) => p.team_id !== null);

  // Se sala ainda não criada
  if (!career) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4">
        <SEOHead title="Criar Sala" ogUrl="/multi/host" />
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/multi')} className="rounded-lg p-2 text-cream/50 hover:text-cream hover:bg-white/5">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-retro text-3xl text-gold">Criar Sala</h1>
          </div>

          <Card className="flex gap-3 p-4 border-red-600/30 bg-red-950/20">
            <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
            <p className="text-sm text-red-200/80">
              Esta janela deve permanecer aberta até o fim do jogo. Se você fechar, todos os jogadores serão desconectados.
            </p>
          </Card>

          <div>
            <p className="mb-2 text-sm text-cream/60">Dificuldade da temporada</p>
            <div className="flex gap-2">
              {DIFFICULTIES.map(({ key, label }) => (
                <button key={key} onClick={() => setDifficulty(key)}
                  className={['flex-1 rounded-xl border py-2.5 text-sm transition-all',
                    difficulty === key ? 'border-gold/50 bg-gold/10 text-cream' : 'border-white/8 text-cream/50 hover:border-white/20'].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button fullWidth size="lg" loading={loading} onClick={handleCreate}>
            <Users size={20} /> Criar Sala
          </Button>
        </div>
      </div>
    );
  }

  // Sala criada — lobby
  return (
    <div className="flex min-h-screen flex-col bg-ink px-4 py-6">
      <div className="mx-auto w-full max-w-lg flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-retro text-2xl text-gold">Sala criada!</h1>
          <button onClick={() => setConfirmLeave(true)} className="text-sm text-cream/40 hover:text-cream transition-colors">
            Encerrar sala
          </button>
        </div>

        {/* Aviso host */}
        <Card className="flex gap-3 p-3 border-red-600/30 bg-red-950/20">
          <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
          <p className="text-xs text-red-200/80">
            Mantenha esta aba aberta. Fechar = fim do jogo para todos.
          </p>
        </Card>

        {/* Código da sala */}
        <Card className="p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-cream/40 mb-2">Código da sala</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-retro text-5xl tracking-widest text-gold">{roomCode}</span>
            <button onClick={handleCopy}
              className="rounded-xl border border-white/10 p-2 text-cream/50 hover:border-gold/40 hover:text-gold transition-all">
              {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
            </button>
          </div>

          {/* QR Code */}
          <div className="mt-4 flex justify-center">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={shareUrl} size={120} />
            </div>
          </div>
          <p className="mt-2 text-xs text-cream/30 break-all">{shareUrl}</p>
        </Card>

        {/* Escolha de time do host */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-cream/70">Seu time (como anfitrião)</p>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {TEAMS.map((t) => {
              const taken = players.some((p) => p.team_id === t.id && p.nickname !== nickname);
              return (
                <button
                  key={t.id}
                  disabled={taken}
                  onClick={() => {
                    setHostTeam(t.id);
                    // Atualizar no career
                    const { career: c } = useMultiStore.getState();
                    if (!c) return;
                    const ps = c.players.map((p) =>
                      p.is_host ? { ...p, team_id: t.id } : p
                    );
                    useMultiStore.setState({ career: { ...c, players: ps } });
                  }}
                  className={['rounded-xl border p-2 text-center transition-all text-xs',
                    hostTeam === t.id ? 'border-gold/50 bg-gold/10' : taken ? 'opacity-30 cursor-not-allowed border-white/4' : 'border-white/8 hover:border-white/20',
                  ].join(' ')}
                  style={{ borderTopColor: t.primary_color, borderTopWidth: 3 }}
                >
                  <div className="font-retro text-base text-cream">{t.short_name}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Lista de jogadores */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-cream/70">
            Jogadores na sala ({players.length}/8)
          </p>
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const team = p.team_id ? getTeamById(p.team_id) : null;
              return (
                <div key={p.nickname} className="flex items-center gap-3 rounded-xl bg-white/4 px-3 py-2">
                  {p.is_connected
                    ? <Wifi size={14} className="text-green-400 shrink-0" />
                    : <WifiOff size={14} className="text-red-400 shrink-0" />
                  }
                  <div className="flex-1">
                    <span className="text-sm font-medium text-cream">
                      {p.nickname} {p.is_host && <span className="text-xs text-gold">(anfitrião)</span>}
                    </span>
                    {team && (
                      <span className="ml-2 text-xs text-cream/50">{team.name}</span>
                    )}
                    {!p.team_id && (
                      <span className="ml-2 text-xs text-cream/30">escolhendo time...</span>
                    )}
                  </div>
                  {!p.is_host && (
                    <button onClick={() => hostKickPlayer(p.nickname)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
                      expulsar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Iniciar */}
        <Button
          fullWidth
          size="lg"
          disabled={!allChosen || !hostTeam}
          onClick={handleStartGame}
        >
          <Play size={20} />
          {allChosen && hostTeam ? 'Iniciar Partida' : 'Aguardando todos escolherem time...'}
        </Button>

        {players.length < 2 && (
          <p className="text-center text-xs text-cream/30">Mínimo 2 jogadores para iniciar</p>
        )}
      </div>

      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Encerrar sala?">
        <p className="mb-4 text-sm text-cream/60">
          Todos os jogadores serão desconectados imediatamente.
        </p>
        <div className="flex gap-3">
          <Button fullWidth variant="secondary" onClick={() => setConfirmLeave(false)}>Cancelar</Button>
          <Button fullWidth variant="danger" onClick={handleLeave}>Encerrar</Button>
        </div>
      </Modal>
    </div>
  );
}
