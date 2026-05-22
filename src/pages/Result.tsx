import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StandingsTable } from '../components/StandingsTable';
import { AnimatedScore } from '../components/AnimatedScore';
import { AchievementToast } from '../components/AchievementToast';
import { PageTransition } from '../components/PageTransition';
import { useCareerStore } from '../stores/careerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getTeamById } from '../data';
import { sortStandings } from '../lib/simulation/engine';
import { contrastColor } from '../lib/utils';
import {
  getNarratorPhrase, fireWinConfetti, fireChampionConfetti,
  shakeElement,
} from '../lib/feedback';
import { playGoal, playDefeat, playWhistle } from '../lib/sound';
import type { AchievementId } from '../lib/storage';

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', yellow: '🟨', red: '🟥', injury: '🤕',
};

export function Result() {
  const navigate = useNavigate();
  const { career, lastResult, clearLastResult } = useCareerStore();
  const { tryUnlockAchievement } = useSettingsStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [newAchievement, setNewAchievement] = useState<AchievementId | null>(null);

  useEffect(() => {
    if (!lastResult || !career) { navigate('/single/career'); return; }

    const diff = lastResult.own_score - lastResult.opponent_score;
    const round = career.current_round - 1; // acabou de simular

    // Sons
    setTimeout(() => playWhistle(), 200);
    if (lastResult.result === 'W') {
      setTimeout(() => { if (lastResult.own_score > 0) playGoal(); }, 800);
      setTimeout(() => fireWinConfetti(), 600);
    } else if (lastResult.result === 'L') {
      setTimeout(() => playDefeat(), 400);
      if (diff <= -4) setTimeout(() => shakeElement(cardRef.current), 500);
    }

    // Título?
    const sortedStandings = sortStandings(career.standings);
    const pos = sortedStandings.findIndex((r) => r.team_id === career.team_id) + 1;
    if (career.status === 'finished' && pos === 1) {
      setTimeout(() => fireChampionConfetti(), 800);
    }

    // Achievements
    (async () => {
      // Goleada histórica
      if (lastResult.result === 'W' && diff >= 5) {
        const isNew = await tryUnlockAchievement('goleada_historica');
        if (isNew) { setNewAchievement('goleada_historica'); return; }
      }
      // Primeira temporada
      if (round === 38) {
        const isNew = await tryUnlockAchievement('primeira_temporada');
        if (isNew) { setNewAchievement('primeira_temporada'); return; }

        // Invicto
        const myMatches = career.matches.filter(
          (m) => m.round <= 38 && (m.home_team_id === career.team_id || m.away_team_id === career.team_id) && m.home_goals !== null
        );
        const neverLost = myMatches.every((m) => {
          const isHome = m.home_team_id === career.team_id;
          const own = isHome ? m.home_goals! : m.away_goals!;
          const opp = isHome ? m.away_goals! : m.home_goals!;
          return own >= opp;
        });
        if (neverLost) {
          const isNew2 = await tryUnlockAchievement('invicto');
          if (isNew2) { setNewAchievement('invicto'); return; }
        }
      }
    })();
  }, []);

  if (!lastResult || !career) return null;

  const team = getTeamById(career.team_id);
  const opp = getTeamById(lastResult.opponent_team_id);
  const badgeBg = team?.primary_color ?? '#d4a017';
  const oppBg = opp?.primary_color ?? '#333';
  const diff = lastResult.own_score - lastResult.opponent_score;
  const simRound = career.current_round - 1;

  const resultColor = lastResult.result === 'W' ? 'text-green-400' : lastResult.result === 'D' ? 'text-yellow-400' : 'text-red-400';
  const resultLabel = lastResult.result === 'W' ? 'Vitória!' : lastResult.result === 'D' ? 'Empate' : 'Derrota';

  const narratorPhrase = getNarratorPhrase(lastResult.result, Math.abs(diff));
  const sortedStandings = sortStandings(career.standings);
  const userPos = sortedStandings.findIndex((r) => r.team_id === career.team_id) + 1;
  const otherMatches = career.matches
    .filter((m) => m.round === simRound && m.home_goals !== null &&
      m.home_team_id !== career.team_id && m.away_team_id !== career.team_id)
    .slice(0, 9);

  const handleNext = () => {
    clearLastResult();
    navigate(career.status === 'finished' ? '/single/career/season-end' : '/single/career');
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center bg-ink px-4 pb-8 pt-6">
        <div className="w-full max-w-lg flex flex-col gap-4">

          {/* Placar */}
          <div ref={cardRef}>
            <Card className="p-6 text-center">
              <p className="mb-1 text-xs uppercase tracking-widest text-cream/40">Rodada {simRound}</p>

              <motion.p
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                className={['font-retro text-3xl tracking-wider', resultColor].join(' ')}
              >
                {resultLabel}
              </motion.p>

              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-20 items-center justify-center rounded-xl"
                    style={{ backgroundColor: badgeBg }}>
                    <span className="font-retro text-2xl" style={{ color: contrastColor(badgeBg) }}>
                      {team?.short_name}
                    </span>
                  </div>
                  <span className="text-xs text-cream/50">{lastResult.home ? 'Casa' : 'Fora'}</span>
                </div>

                <div className="flex items-center gap-3 font-retro text-5xl text-cream">
                  <AnimatedScore score={lastResult.own_score} delay={400} />
                  <span className="text-cream/30">-</span>
                  <AnimatedScore score={lastResult.opponent_score} delay={600} />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-20 items-center justify-center rounded-xl"
                    style={{ backgroundColor: oppBg }}>
                    <span className="font-retro text-2xl" style={{ color: contrastColor(oppBg) }}>
                      {opp?.short_name ?? '?'}
                    </span>
                  </div>
                  <span className="text-xs text-cream/50">{lastResult.home ? 'Fora' : 'Casa'}</span>
                </div>
              </div>

              {/* Narrador */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="mt-3 text-sm italic text-cream/50"
              >
                "{narratorPhrase}"
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-3 flex items-center justify-center gap-1.5"
              >
                <Star size={14} className="text-gold fill-gold" />
                <span className="font-retro text-xl text-gold">+{lastResult.points_earned}</span>
                <span className="text-sm text-cream/40">pts do treinador</span>
              </motion.div>
            </Card>
          </div>

          {/* Eventos */}
          {lastResult.events.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-cream/70">Eventos do jogo</h3>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {lastResult.events.map((evt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center gap-2 text-sm text-cream/70"
                  >
                    <span className="w-8 shrink-0 font-retro text-base text-cream/40">{evt.minute}'</span>
                    <span>{EVENT_ICONS[evt.type] ?? '•'}</span>
                    <span>{evt.description}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Outros resultados */}
          {otherMatches.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-cream/70">Outros resultados</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {otherMatches.map((m, i) => {
                  const h = getTeamById(m.home_team_id);
                  const a = getTeamById(m.away_team_id);
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-white/4 px-2 py-1.5 text-xs">
                      <span className="text-cream/70">{h?.short_name}</span>
                      <span className="font-retro text-sm text-cream">{m.home_goals} - {m.away_goals}</span>
                      <span className="text-cream/70">{a?.short_name}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Mini tabela */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-cream/70">Tabela</h3>
              <span className="text-xs text-gold">Você: {userPos}º</span>
            </div>
            <StandingsTable standings={sortedStandings} userTeamId={career.team_id} compact />
          </Card>

          <Button fullWidth size="lg" onClick={handleNext}>
            Próxima Rodada <ArrowRight size={18} />
          </Button>
        </div>

        <AchievementToast
          achievementId={newAchievement}
          onDismiss={() => setNewAchievement(null)}
        />
      </div>
    </PageTransition>
  );
}
