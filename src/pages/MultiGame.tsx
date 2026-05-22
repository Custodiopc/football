import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Calendar, BarChart2, Users, MessageSquare, X, Wifi, WifiOff, Bot } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { ChatPanel } from '../components/ChatPanel';
import { StandingsTable } from '../components/StandingsTable';
import { MatchCalendar } from '../components/MatchCalendar';
import { PlayerList } from '../components/PlayerList';
import { useMultiStore } from '../stores/multiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getTeamById, getPlayersByTeam } from '../data';
import { getUserMatch } from '../lib/calendar';
import { sortStandings } from '../lib/simulation/engine';
import { contrastColor } from '../lib/utils';

type Tab = 'next' | 'calendar' | 'standings' | 'squad';

export function MultiGame() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const nickname = useSettingsStore((s) => s.nickname);
  const { career, role, connectionStatus, myNickname, hostSimulateRound, leaveRoom } = useMultiStore();

  const [tab, setTab] = useState<Tab>('next');
  const [chatOpen, setChatOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const myNick = nickname ?? myNickname;
  const me = career?.players.find((p) => p.nickname === myNick);
  const myTeamId = me?.team_id ?? null;

  // Redirecionar se desconectado
  useEffect(() => {
    if (connectionStatus === 'failed') {
      navigate('/multi');
    }
  }, [connectionStatus, navigate]);

  // Redirecionar se carreira acabou
  useEffect(() => {
    if (career?.status === 'finished') {
      navigate('/multi');
    }
  }, [career?.status, navigate]);

  if (!career || !myTeamId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="animate-pulse font-retro text-2xl text-gold">Carregando...</span>
      </div>
    );
  }

  const team = getTeamById(myTeamId);
  const badgeBg = team?.primary_color ?? '#d4a017';
  const round = career.current_round;
  const sortedStandings = sortStandings(career.standings);
  const userPos = sortedStandings.findIndex((r) => r.team_id === myTeamId) + 1;
  const teamPlayers = getPlayersByTeam(myTeamId);

  const userMatch = getUserMatch(career.matches, round, myTeamId);
  const oppId = userMatch
    ? (userMatch.home_team_id === myTeamId ? userMatch.away_team_id : userMatch.home_team_id)
    : null;
  const opp = oppId ? getTeamById(oppId) : null;

  // Verificar se eu já submeti lineup
  const myLineupSubmitted = me?.lineup_submitted ?? false;

  // Verificar se todos estão prontos para simular (só host enxerga)
  const allReady = career.players.every((p) => p.lineup_submitted || p.is_ai);

  const handleSimulate = () => {
    setSimulating(true);
    hostSimulateRound();
    setSimulating(false);
  };

  const handleSubmitLineup = () => {
    // Navegar para tela de escalação do single-player adaptada
    navigate(`/multi/game/${roomCode}/lineup`);
  };

  const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'next',      label: 'Próximo',    icon: <Trophy size={18} /> },
    { key: 'calendar',  label: 'Calendário', icon: <Calendar size={18} /> },
    { key: 'standings', label: 'Tabela',     icon: <BarChart2 size={18} /> },
    { key: 'squad',     label: 'Elenco',     icon: <Users size={18} /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-ink pb-20 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/8 bg-ink/90 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          {team && (
            <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: badgeBg }}>
              <span className="font-retro text-sm tracking-widest" style={{ color: contrastColor(badgeBg) }}>
                {team.short_name}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-cream/50">
              Rodada {round}/38 · {userPos}º · Sala {roomCode}
            </p>
            {/* Status dos jogadores */}
            <div className="flex gap-1.5 mt-0.5 flex-wrap">
              {career.players.map((p) => (
                <span key={p.nickname} className={['text-xs flex items-center gap-0.5',
                  p.is_ai ? 'text-orange-400' : p.is_connected ? 'text-green-400' : 'text-red-400'].join(' ')}>
                  {p.is_ai ? <Bot size={10} /> : p.is_connected ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {p.nickname}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setChatOpen(!chatOpen)}
            className="rounded-lg p-2 text-cream/50 hover:text-cream hover:bg-white/5 relative">
            <MessageSquare size={18} />
          </button>
          <button onClick={() => setConfirmLeave(true)}
            className="rounded-lg p-2 text-cream/40 hover:text-cream hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/6">
          {TAB_ITEMS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={['flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors',
                tab === key ? 'border-b-2 border-gold text-gold' : 'text-cream/40 hover:text-cream/70'].join(' ')}>
              {icon}
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout dois painéis (desktop: game + chat) */}
      <div className="flex flex-1 min-h-0">
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {tab === 'next' && (
            <div className="flex flex-col gap-4">
              {/* Match card */}
              {userMatch && opp && (
                <Card className="p-4">
                  <p className="mb-3 text-xs uppercase tracking-wider text-cream/40">Rodada {round}</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-16 items-center justify-center rounded-xl"
                        style={{ backgroundColor: badgeBg }}>
                        <span className="font-retro text-xl" style={{ color: contrastColor(badgeBg) }}>
                          {team?.short_name}
                        </span>
                      </div>
                      <span className="text-xs text-cream/50">
                        {userMatch.home_team_id === myTeamId ? 'Casa' : 'Fora'}
                      </span>
                    </div>
                    <span className="font-retro text-2xl text-cream/30">VS</span>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex h-12 w-16 items-center justify-center rounded-xl"
                        style={{ backgroundColor: opp.primary_color }}>
                        <span className="font-retro text-xl" style={{ color: contrastColor(opp.primary_color) }}>
                          {opp.short_name}
                        </span>
                      </div>
                      <span className="text-xs text-cream/50">
                        {userMatch.home_team_id === myTeamId ? 'Fora' : 'Casa'}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Status de cada jogador */}
              <Card className="p-4">
                <p className="mb-3 text-sm font-medium text-cream/70">Status de escalação</p>
                <div className="flex flex-col gap-2">
                  {career.players.map((p) => {
                    const pTeam = p.team_id ? getTeamById(p.team_id) : null;
                    return (
                      <div key={p.nickname} className="flex items-center gap-3 rounded-xl bg-white/4 px-3 py-2 text-sm">
                        <span className={['font-medium', p.nickname === myNick ? 'text-gold' : 'text-cream'].join(' ')}>
                          {p.nickname}
                        </span>
                        {pTeam && <span className="text-xs text-cream/40">{pTeam.short_name}</span>}
                        <div className="ml-auto">
                          {p.is_ai
                            ? <span className="text-xs text-orange-400">IA</span>
                            : p.lineup_submitted
                              ? <span className="text-xs text-green-400">✓ Pronto</span>
                              : <span className="text-xs text-yellow-400">Escalando...</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Ações */}
              <Card className="p-4 flex flex-col gap-2">
                {!myLineupSubmitted && (
                  <Button fullWidth variant="secondary" onClick={handleSubmitLineup}>
                    Escalar meu time
                  </Button>
                )}
                {myLineupSubmitted && (
                  <p className="text-center text-sm text-green-400">✓ Escalação enviada</p>
                )}
                {role === 'host' && (
                  <Button
                    fullWidth
                    disabled={!allReady}
                    loading={simulating}
                    onClick={handleSimulate}
                  >
                    {allReady ? 'Simular Rodada' : 'Aguardando escalações...'}
                  </Button>
                )}
                {role === 'guest' && !allReady && (
                  <p className="text-center text-xs text-cream/40">
                    Aguardando todos escalarem para o anfitrião simular...
                  </p>
                )}
              </Card>
            </div>
          )}

          {tab === 'calendar' && (
            <MatchCalendar matches={career.matches} userTeamId={myTeamId} currentRound={round} />
          )}

          {tab === 'standings' && (
            <Card className="p-3">
              <StandingsTable standings={sortedStandings} userTeamId={myTeamId} />
            </Card>
          )}

          {tab === 'squad' && (
            <PlayerList
              players={teamPlayers}
              playerStates={career.player_states}
              currentRound={round}
            />
          )}
        </div>

        {/* Chat sidebar desktop */}
        {chatOpen && (
          <div className="hidden lg:flex w-72 shrink-0 border-l border-white/8 flex-col">
            <ChatPanel className="flex-1 rounded-none border-0" onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>

      {/* Chat drawer mobile */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 lg:hidden"
          onClick={() => setChatOpen(false)}>
          <div className="h-2/3" onClick={(e) => e.stopPropagation()}>
            <ChatPanel className="h-full rounded-b-none" onClose={() => setChatOpen(false)} />
          </div>
        </div>
      )}

      {/* Modal sair */}
      <Modal open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Sair da sala?">
        <p className="mb-4 text-sm text-cream/60">
          {role === 'host'
            ? 'Você é o anfitrião. Sair encerrará o jogo para todos.'
            : 'Ao sair, a IA assumirá seu time após 60 segundos.'}
        </p>
        <div className="flex gap-3">
          <Button fullWidth variant="secondary" onClick={() => setConfirmLeave(false)}>Cancelar</Button>
          <Button fullWidth variant="danger" onClick={async () => { await leaveRoom(); navigate('/'); }}>
            Sair
          </Button>
        </div>
      </Modal>
    </div>
  );
}
