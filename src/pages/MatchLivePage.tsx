import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkipForward, Pause, Play, FastForward, Zap } from 'lucide-react';
import { LiveScoreboard } from '../components/LiveScoreboard';
import { useCareerStore } from '../stores/careerStore';
import { playWhistle, playGoal, playDefeat } from '../lib/sound';
import { applyFinancialRound, processAcademyRound, applyMarketRound } from '../lib/simulation/engine';
import { getTeamById } from '../data';
import type { LiveEvent, MatchSpeed } from '../lib/simulation/matchStats';
import { SPEED_MS, interpolateStats } from '../lib/simulation/matchStats';

const SPEED_ORDER: MatchSpeed[] = ['normal', 'fast', 'very_fast'];

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  const homePct = Math.round((home / total) * 100);
  const awayPct  = 100 - homePct;
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-0.5" style={{ fontSize: 11, color: '#a8b8cc' }}>
        <span style={{ fontWeight: 600, color: '#f5f5f0' }}>{home}</span>
        <span style={{ color: '#6b7c93' }}>{label}</span>
        <span style={{ fontWeight: 600, color: '#f5f5f0' }}>{away}</span>
      </div>
      <div className="flex" style={{ height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: '#0d1f36' }}>
        <div style={{ width: `${homePct}%`, backgroundColor: '#f5d020', transition: 'width 0.5s' }} />
        <div style={{ width: `${awayPct}%`, backgroundColor: '#1e3a5c' }} />
      </div>
    </div>
  );
}

export function MatchLivePage() {
  const navigate = useNavigate();
  const {
    career, pendingLiveMatch, setPendingLiveMatch,
    applyRoundResult,
  } = useCareerStore();

  const [minute, setMinute]           = useState(0);
  const [displayedEvents, setDisplayedEvents] = useState<LiveEvent[]>([]);
  const [speed, setSpeed]             = useState<MatchSpeed>('fast');
  const [paused, setPaused]           = useState(false);
  const [homeScore, setHomeScore]     = useState(0);
  const [awayScore, setAwayScore]     = useState(0);
  const [isFinished, setIsFinished]   = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [currentStats, setCurrentStats] = useState(
    pendingLiveMatch ? interpolateStats(pendingLiveMatch.stats, 0) : null
  );

  const eventListRef = useRef<HTMLDivElement>(null);
  const sim = pendingLiveMatch;

  // Redirect se não há partida pendente
  useEffect(() => {
    if (!sim || !career) { navigate('/single/career'); return; }
  }, [sim, career, navigate]);

  // Finalizar partida e gravar resultado
  const finishMatch = useCallback(async () => {
    if (!sim || !career) return;
    setIsFinished(true);

    const result = sim.careerRoundOutput.user_match_summary.result;
    result === 'W' ? playWhistle() : result === 'L' ? playDefeat() : playWhistle();

    const team           = getTeamById(career.team_id);
    const financeUpdate  = applyFinancialRound(career, result, sim.careerRoundOutput.user_match_summary.home, sim.careerRoundOutput.user_match_summary.opponent_team_id);
    const academyUpdate  = team ? processAcademyRound(career, team) : null;
    const marketUpdate   = applyMarketRound(career);

    await applyRoundResult(
      sim.careerRoundOutput.matches_with_results,
      sim.careerRoundOutput.updated_standings,
      sim.careerRoundOutput.updated_player_states,
      sim.careerRoundOutput.user_match_summary,
      financeUpdate,
      academyUpdate,
      marketUpdate,
    );
    // NÃO zera pendingLiveMatch aqui — a tela precisa continuar visível
    // até o usuário clicar em "Ver resultado"
  }, [sim, career, applyRoundResult]);

  const handleSkip = useCallback(async () => {
    if (!sim || isFinished) return;
    setSkipConfirm(false);
    setMinute(92);
    setHomeScore(sim.home_score);
    setAwayScore(sim.away_score);
    setDisplayedEvents([...sim.events].reverse());
    setCurrentStats(sim.stats);
    await finishMatch();
  }, [sim, isFinished, finishMatch]);

  // Timer principal — para quando isFinished OU minute >= 92
  useEffect(() => {
    if (!sim || isFinished || paused || minute >= 92) return;
    if (speed === 'instant') { handleSkip(); return; }

    const ms = SPEED_MS[speed];
    const timer = setTimeout(() => {
      const next = minute + 1;

      // Revelar eventos deste minuto
      const eventsNow = sim.events.filter((e) => e.minute === next);
      if (eventsNow.length > 0) {
        for (const evt of eventsNow) {
          if (evt.is_goal) {
            playGoal();
            if (sim.home_team_id === career?.team_id) {
              if (evt.team_id === sim.home_team_id) setHomeScore((s) => s + 1);
              else                                  setAwayScore((s) => s + 1);
            } else {
              if (evt.team_id === sim.away_team_id) setAwayScore((s) => s + 1);
              else                                  setHomeScore((s) => s + 1);
            }
          }
        }
        setDisplayedEvents((prev) => [...eventsNow, ...prev]);
        setTimeout(() => {
          eventListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }

      if (next === 45) playWhistle();
      if (next <= 91) setCurrentStats(interpolateStats(sim.stats, next));
      setMinute(next);
    }, ms);

    return () => clearTimeout(timer);
  }, [sim, isFinished, paused, minute, speed, career, handleSkip]);

  // Detectar fim
  useEffect(() => {
    if (minute > 91 && !isFinished) {
      finishMatch();
    }
  }, [minute, isFinished, finishMatch]);

  if (!sim || !career) return null;

  const isUserHome   = career.team_id === sim.home_team_id;
  const isHalfTime   = minute === 45 && !isFinished;
  const isFullTime   = isFinished || minute > 90;
  const userScore    = isUserHome ? homeScore : awayScore;
  const oppScore     = isUserHome ? awayScore : homeScore;
  const resultColor  = userScore > oppScore ? '#4ade80' : userScore === oppScore ? '#f5d020' : '#ef4444';

  const stats = currentStats ?? sim.stats;

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100vh', backgroundColor: '#0a1e35', color: '#f5f5f0' }}
    >
      {/* Placar */}
      <LiveScoreboard
        homeTeamId={sim.home_team_id}
        awayTeamId={sim.away_team_id}
        homeScore={homeScore}
        awayScore={awayScore}
        minute={minute}
        isHalfTime={isHalfTime}
        isFullTime={isFullTime}
      />

      {/* Subtítulo */}
      <div
        className="text-center py-1.5 shrink-0"
        style={{ backgroundColor: '#15304f', borderBottom: '1px solid #1e3a5c', fontSize: 11, color: '#a8b8cc' }}
      >
        Brasileirão Série A · Rodada {career.current_round}
      </div>

      {/* Corpo: eventos + stats */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Feed de eventos */}
        <div
          ref={eventListRef}
          className="flex-1 overflow-auto p-3"
          style={{ borderRight: '1px solid #1e3a5c' }}
        >
          {displayedEvents.length === 0 && (
            <p style={{ color: '#1e3a5c', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
              Aguardando eventos...
            </p>
          )}
          {displayedEvents.map((evt, i) => {
            const isGoal   = evt.is_goal;
            const isUser   = evt.is_user_team;
            const minStr   = evt.minute > 90 ? `90+${evt.minute - 90}'` : `${evt.minute}'`;

            return (
              <div
                key={i}
                className="flex gap-2 mb-2 rounded px-2 py-1.5 animate-in fade-in"
                style={{
                  backgroundColor: isGoal && isUser ? 'rgba(74,222,128,0.08)'
                    : isGoal ? 'rgba(239,68,68,0.08)'
                    : 'transparent',
                  border: isGoal
                    ? `1px solid ${isUser ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`
                    : '1px solid transparent',
                }}
              >
                {/* Minuto */}
                <span
                  className="shrink-0 font-retro"
                  style={{ fontSize: 14, color: '#6b7c93', minWidth: 36, textAlign: 'right' }}
                >
                  {minStr}
                </span>

                {/* Ícone */}
                <span className="shrink-0" style={{ fontSize: 14 }}>
                  {evt.type === 'goal'       ? (isUser ? '⚽' : '⚽') :
                   evt.type === 'yellow'     ? '🟨' :
                   evt.type === 'red'        ? '🟥' :
                   evt.type === 'injury'     ? '🤕' :
                   evt.type === 'big_save'   ? '🧤' :
                   evt.type === 'shot_missed'? '💨' :
                   evt.type === 'half_time'  ? '🔔' :
                   evt.type === 'full_time'  ? '🏁' : '•'}
                </span>

                {/* Narração */}
                <span style={{
                  fontSize: isGoal ? 13 : 11,
                  fontWeight: isGoal ? 700 : 400,
                  color: isGoal && isUser ? '#4ade80'
                    : isGoal ? '#ef4444'
                    : evt.type === 'half_time' || evt.type === 'full_time' ? '#f5d020'
                    : '#a8b8cc',
                  lineHeight: 1.4,
                }}>
                  {evt.narrative}
                </span>
              </div>
            );
          })}
        </div>

        {/* Estatísticas */}
        <div
          className="hidden sm:flex flex-col shrink-0 p-3"
          style={{ width: 200, backgroundColor: '#0d1f36' }}
        >
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7c93', marginBottom: 10 }}>
            Estatísticas
          </p>
          <StatBar label="Posse (%)" home={stats.possession_home} away={100 - stats.possession_home} />
          <StatBar label="Chutes" home={stats.home.shots} away={stats.away.shots} />
          <StatBar label="No gol"  home={stats.home.shots_on_target} away={stats.away.shots_on_target} />
          <StatBar label="Escanteios" home={stats.home.corners} away={stats.away.corners} />
          <StatBar label="Faltas"  home={stats.home.fouls} away={stats.away.fouls} />
          <StatBar label="Amarelos" home={stats.home.yellow_cards} away={stats.away.yellow_cards} />

          {/* Resultado atual */}
          {(isFinished || isFullTime) && (
            <div
              className="mt-4 rounded px-3 py-2 text-center"
              style={{ backgroundColor: '#15304f', border: `1px solid ${resultColor}33` }}
            >
              <div className="font-retro" style={{ fontSize: 18, color: resultColor }}>
                {userScore > oppScore ? 'VITÓRIA!' : userScore === oppScore ? 'EMPATE' : 'DERROTA'}
              </div>
              <div style={{ fontSize: 11, color: '#6b7c93', marginTop: 2 }}>
                {userScore > oppScore ? '+3 pontos' : userScore === oppScore ? '+1 ponto' : '0 pontos'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: '#0d1f36', borderTop: '1px solid #1e3a5c' }}
      >
        {/* Velocidade */}
        <div className="flex items-center gap-1.5">
          {!isFinished && SPEED_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                backgroundColor: speed === s ? '#f5d020' : '#15304f',
                color:           speed === s ? '#0a1e35' : '#6b7c93',
                border:          speed === s ? '1px solid #f5d020' : '1px solid #1e3a5c',
                fontWeight:      speed === s ? 700 : 400,
              }}
            >
              {s === 'normal' ? <><FastForward size={10} style={{ display:'inline', marginRight:3 }} />Normal</>
               : s === 'fast' ? <><Zap size={10} style={{ display:'inline', marginRight:3 }} />Rápido</>
               : <><SkipForward size={10} style={{ display:'inline', marginRight:3 }} />Turbo</>}
            </button>
          ))}
        </div>

        {/* Pausa + Pular */}
        <div className="flex items-center gap-2">
          {!isFinished && (
            <>
              <button
                onClick={() => setPaused((p) => !p)}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors"
                style={{ fontSize: 12, color: '#a8b8cc', backgroundColor: '#15304f', border: '1px solid #1e3a5c', cursor: 'pointer' }}
              >
                {paused ? <><Play size={13} /> Retomar</> : <><Pause size={13} /> Pausar</>}
              </button>
              <button
                onClick={() => setSkipConfirm(true)}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors"
                style={{ fontSize: 12, color: '#6b7c93', backgroundColor: '#15304f', border: '1px solid #1e3a5c', cursor: 'pointer' }}
              >
                <SkipForward size={13} /> Pular
              </button>
            </>
          )}
          {isFinished && (
            <button
              onClick={() => { setPendingLiveMatch(null); navigate('/single/career/result'); }}
              className="rounded px-4 py-2 font-semibold transition-all"
              style={{ fontSize: 13, backgroundColor: '#f5d020', color: '#0a1e35', border: 'none', cursor: 'pointer' }}
            >
              Ver resultado completo »
            </button>
          )}
        </div>
      </div>

      {/* Modal: confirmar pular */}
      {skipConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(10,30,53,0.9)' }}
        >
          <div
            className="rounded-xl p-6 text-center"
            style={{ backgroundColor: '#15304f', border: '1px solid #1e3a5c', maxWidth: 360, width: '90%' }}
          >
            <p style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f0', marginBottom: 6 }}>
              Pular transmissão?
            </p>
            <p style={{ fontSize: 12, color: '#a8b8cc', marginBottom: 20 }}>
              O resultado será revelado imediatamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSkipConfirm(false)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, cursor: 'pointer', backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', color: '#a8b8cc' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSkip}
                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, cursor: 'pointer', backgroundColor: '#f5d020', border: 'none', color: '#0a1e35', fontWeight: 700 }}
              >
                Pular »
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
