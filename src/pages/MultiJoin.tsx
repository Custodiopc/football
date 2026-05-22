import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { NicknameInput } from '../components/NicknameInput';
import { useMultiStore } from '../stores/multiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { TEAMS, getTeamById } from '../data';

export function MultiJoin() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const nickname = useSettingsStore((s) => s.nickname);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const { guestJoinRoom, guestSetTeam, career, connectionStatus, myNickname, leaveRoom } = useMultiStore();

  const [phase, setPhase] = useState<'nickname' | 'connecting' | 'lobby' | 'error'>('nickname');
  const [errorMsg, setErrorMsg] = useState('');
  const [savingNick, setSavingNick] = useState(false);

  // Aviso ao fechar aba durante jogo ativo
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (career) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [career]);

  // Se tem nickname salvo, pula essa fase
  useEffect(() => {
    if (nickname && phase === 'nickname') setPhase('connecting');
  }, [nickname, phase]);

  // Conectar quando fase = connecting
  useEffect(() => {
    if (phase !== 'connecting' || !roomCode) return;
    const nick = nickname ?? myNickname;
    if (!nick) return;

    let cancelled = false;
    (async () => {
      try {
        await guestJoinRoom(roomCode, nick);
        if (!cancelled) setPhase('lobby');
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(String(e));
          setPhase('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [phase]);

  // Se jogo iniciou (career existe e tem jogadores), ir para o game
  useEffect(() => {
    if (career && connectionStatus === 'connected' && phase === 'lobby') {
      // Checar se o host clicou em iniciar (career.current_round == 1 e todos tem time)
      const allChosen = career.players.every((p) => p.team_id !== null);
      if (allChosen && career.players.length >= 2) {
        navigate(`/multi/game/${roomCode}`);
      }
    }
  }, [career, connectionStatus]);

  const handleNicknameSave = async (n: string) => {
    setSavingNick(true);
    await setNickname(n);
    setSavingNick(false);
    setPhase('connecting');
  };

  if (phase === 'nickname') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <h1 className="font-retro text-3xl text-gold text-center">
            Entrar na sala<br />
            <span className="text-cream/50">{roomCode}</span>
          </h1>
          <Card className="flex gap-3 p-4 border-yellow-600/30 bg-yellow-950/20">
            <AlertTriangle size={16} className="shrink-0 text-yellow-400 mt-0.5" />
            <p className="text-xs text-yellow-200/80">
              Se sua conexão cair por mais de 60 segundos, a IA assume seu time.
            </p>
          </Card>
          <Card className="p-5">
            <NicknameInput onSave={handleNicknameSave} loading={savingNick} />
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'connecting') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
        <span className="animate-pulse font-retro text-3xl text-gold">Conectando...</span>
        <p className="text-sm text-cream/50">Entrando na sala {roomCode}</p>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gold" />
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4 text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="font-retro text-2xl text-red-400">Não foi possível conectar</h2>
        <p className="max-w-xs text-sm text-cream/60">{errorMsg}</p>
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={() => { setPhase('connecting'); setErrorMsg(''); }}>
            Tentar novamente
          </Button>
          <Button onClick={() => navigate('/multi')}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Lobby — aguardando host iniciar
  const players = career?.players ?? [];
  const myPlayer = players.find((p) => p.nickname === (nickname ?? myNickname));

  return (
    <div className="flex min-h-screen flex-col bg-ink px-4 py-6">
      <div className="mx-auto w-full max-w-lg flex flex-col gap-5">
        <div className="text-center">
          <h1 className="font-retro text-3xl text-gold">Sala {roomCode}</h1>
          <p className="text-sm text-cream/50">Aguardando o anfitrião iniciar...</p>
        </div>

        <Card className="flex gap-3 p-3 border-yellow-600/30 bg-yellow-950/20">
          <AlertTriangle size={16} className="shrink-0 text-yellow-400 mt-0.5" />
          <p className="text-xs text-yellow-200/80">
            Se sua conexão cair por mais de 60s, a IA assume seu time.
          </p>
        </Card>

        {/* Escolher time */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-cream/70">Escolha seu time</p>
          {myPlayer?.team_id ? (
            <div className="mb-3 text-center">
              <span className="text-sm text-green-400">✓ {getTeamById(myPlayer.team_id)?.name}</span>
              <button onClick={() => guestSetTeam(0)} className="ml-2 text-xs text-cream/40 hover:text-cream">trocar</button>
            </div>
          ) : null}
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {TEAMS.map((t) => {
              const taken = players.some((p) => p.team_id === t.id && p.nickname !== (nickname ?? myNickname));
              const mine = myPlayer?.team_id === t.id;
              return (
                <button
                  key={t.id}
                  disabled={taken}
                  onClick={() => guestSetTeam(t.id)}
                  className={['rounded-xl border p-2 text-center transition-all text-xs',
                    mine ? 'border-gold/50 bg-gold/10' : taken ? 'opacity-30 cursor-not-allowed border-white/4' : 'border-white/8 hover:border-white/20',
                  ].join(' ')}
                  style={{ borderTopColor: t.primary_color, borderTopWidth: 3 }}
                >
                  <div className="font-retro text-base text-cream">{t.short_name}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Jogadores na sala */}
        <Card className="p-4">
          <p className="mb-3 text-sm font-medium text-cream/70">Jogadores ({players.length})</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => {
              const team = p.team_id ? getTeamById(p.team_id) : null;
              return (
                <div key={p.nickname} className="flex items-center gap-3 rounded-xl bg-white/4 px-3 py-2">
                  {p.is_connected
                    ? <Wifi size={14} className="text-green-400 shrink-0" />
                    : <WifiOff size={14} className="text-red-400 shrink-0" />}
                  <span className="flex-1 text-sm text-cream">
                    {p.nickname} {p.is_host && <span className="text-xs text-gold">(anfitrião)</span>}
                  </span>
                  {team
                    ? <span className="text-xs text-cream/50">{team.short_name}</span>
                    : <span className="text-xs text-cream/30">escolhendo...</span>}
                </div>
              );
            })}
          </div>
        </Card>

        <Button variant="ghost" onClick={async () => { await leaveRoom(); navigate('/multi'); }}>
          Sair da sala
        </Button>
      </div>
    </div>
  );
}
