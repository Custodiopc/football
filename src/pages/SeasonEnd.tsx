import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, TrendingDown, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AchievementToast } from '../components/AchievementToast';
import { PageTransition } from '../components/PageTransition';
import { useCareerStore } from '../stores/careerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getTeamById, PLAYERS } from '../data';
import { sortStandings } from '../lib/simulation/engine';
import { calcSeasonPoints, startNewSeason } from '../lib/career';
import { processAcademyAging } from '../lib/academy';
import { contrastColor } from '../lib/utils';
import { fireChampionConfetti, getNarratorPhrase } from '../lib/feedback';
import { playWhistle, playGoal } from '../lib/sound';
import { addCareerToHistory } from '../lib/storage';
import type { AchievementId } from '../lib/storage';

export function SeasonEnd() {
  const navigate = useNavigate();
  const { career, startCareer, hydrated } = useCareerStore();
  const { tryUnlockAchievement } = useSettingsStore();
  const [starting, setStarting] = useState(false);
  const [newAchievement, setNewAchievement] = useState<AchievementId | null>(null);

  useEffect(() => {
    if (hydrated && !career) navigate('/');
  }, [hydrated, career, navigate]);

  useEffect(() => {
    if (!career) return;
    const sorted = sortStandings(career.standings);
    const pos = sorted.findIndex((r) => r.team_id === career.team_id) + 1;

    if (pos === 1) {
      setTimeout(() => fireChampionConfetti(), 500);
      setTimeout(() => playGoal(), 600);
    } else {
      setTimeout(() => playWhistle(), 400);
    }

    // Salvar no histórico
    const team = getTeamById(career.team_id);
    const row = sorted.find((r) => r.team_id === career.team_id);
    addCareerToHistory({
      id: career.id,
      team_name: team?.name ?? '?',
      season: career.season,
      position: pos,
      points: row?.points ?? 0,
      difficulty: career.difficulty,
      manager_points: calcSeasonPoints(career),
      finished_at: Date.now(),
    });

    // Achievements de final de temporada
    (async () => {
      const isNew = await tryUnlockAchievement('primeira_temporada');
      if (isNew) { setNewAchievement('primeira_temporada'); return; }

      // Invicto
      const myMatches = career.matches.filter(
        (m) => m.home_goals !== null && (m.home_team_id === career.team_id || m.away_team_id === career.team_id)
      );
      const neverLost = myMatches.every((m) => {
        const isHome = m.home_team_id === career.team_id;
        const own = isHome ? m.home_goals! : m.away_goals!;
        const opp = isHome ? m.away_goals! : m.home_goals!;
        return own >= opp;
      });
      if (neverLost) {
        const i2 = await tryUnlockAchievement('invicto');
        if (i2) { setNewAchievement('invicto'); return; }
      }

      // Artilheiro
      const goalEvents = career.matches.flatMap((m) => m.events)
        .filter((e) => e.type === 'goal' && e.team_id === career.team_id);
      const scorers: Record<number, number> = {};
      goalEvents.forEach((e) => { scorers[e.player_id] = (scorers[e.player_id] ?? 0) + 1; });
      if (Object.values(scorers).some((g) => g >= 20)) {
        const i3 = await tryUnlockAchievement('artilheiro');
        if (i3) { setNewAchievement('artilheiro'); }
      }
    })();
  }, []);

  if (!career) return null;

  const team = getTeamById(career.team_id);
  const badgeBg = team?.primary_color ?? '#d4a017';
  const sortedStandings = sortStandings(career.standings);
  const pos = sortedStandings.findIndex((r) => r.team_id === career.team_id) + 1;
  const myRow = sortedStandings.find((r) => r.team_id === career.team_id);
  const isChampion = pos === 1;
  const isRelegated = pos >= 17;
  const isLibertadores = pos <= 6;
  const finalPoints = calcSeasonPoints(career);
  const narratorPhrase = getNarratorPhrase('W', 0, isChampion, isRelegated);

  const teamPlayers = PLAYERS.filter((p) => p.team_id === career.team_id);
  const goalEvents = career.matches.flatMap((m) => m.events).filter((e) => e.type === 'goal' && e.team_id === career.team_id);
  const scorers: Record<number, number> = {};
  goalEvents.forEach((e) => { scorers[e.player_id] = (scorers[e.player_id] ?? 0) + 1; });
  const topScorerEntry = Object.entries(scorers).sort(([, a], [, b]) => b - a)[0];
  const topScorer = topScorerEntry ? teamPlayers.find((p) => p.id === Number(topScorerEntry[0])) : null;
  const topScorerGoals = topScorerEntry ? topScorerEntry[1] : 0;

  const handleNewSeason = async () => {
    setStarting(true);
    // Processar academia (envelhecimento + promoção automática aos 21)
    const { career: agedCareer } = processAcademyAging(career);
    const newCareer = startNewSeason(agedCareer);
    await startCareer(newCareer);
    navigate('/single/career');
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center bg-ink px-4 pb-8 pt-10">
        <div className="w-full max-w-lg flex flex-col gap-5">

          <motion.div className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}>
            <div className="mb-2 text-5xl">
              {isChampion ? '🏆' : isRelegated ? '📉' : isLibertadores ? '🌎' : '⚽'}
            </div>
            <h1 className="font-retro text-4xl tracking-wide text-gold">
              {isChampion ? 'CAMPEÃO!' : `Temporada ${career.season}`}
            </h1>
            <p className="mt-2 text-sm italic text-cream/50">"{narratorPhrase}"</p>
          </motion.div>

          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: badgeBg }}>
              <span className="font-retro text-3xl" style={{ color: contrastColor(badgeBg) }}>
                {team?.short_name}
              </span>
            </div>
            <div>
              <p className="font-body font-semibold text-cream">{team?.name}</p>
              <p className="font-retro text-4xl text-gold">{pos}º lugar</p>
              {isChampion && <p className="text-sm text-green-400 flex items-center gap-1"><Trophy size={12} />Campeão Brasileiro!</p>}
              {isRelegated && <p className="text-sm text-red-400 flex items-center gap-1"><TrendingDown size={12} />Rebaixado</p>}
              {!isChampion && isLibertadores && <p className="text-sm text-blue-400 flex items-center gap-1"><Medal size={12} />Libertadores</p>}
            </div>
          </Card>

          {myRow && (
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-cream/60">Estatísticas</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Jogos', value: myRow.played },
                  { label: 'Vitórias', value: myRow.wins },
                  { label: 'Empates', value: myRow.draws },
                  { label: 'Derrotas', value: myRow.losses },
                  { label: 'Gols Pró', value: myRow.goals_for },
                  { label: 'Gols Cont', value: myRow.goals_against },
                  { label: 'Saldo', value: myRow.goals_for - myRow.goals_against },
                  { label: 'Pontos', value: myRow.points },
                  { label: 'Posição', value: `${pos}º` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white/4 p-2">
                    <p className="text-xs text-cream/40">{label}</p>
                    <p className="font-retro text-xl text-gold">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {topScorer && (
            <Card className="flex items-center gap-3 p-4">
              <span className="text-2xl">⚽</span>
              <div>
                <p className="text-xs text-cream/40">Artilheiro do time</p>
                <p className="font-medium text-cream">{topScorer.name}</p>
                <p className="font-retro text-xl text-gold">{topScorerGoals} gols</p>
              </div>
            </Card>
          )}

          <Card className="p-4 text-center">
            <p className="text-xs text-cream/40 uppercase tracking-wider">Pontuação do Treinador</p>
            <motion.p className="font-retro text-5xl text-gold mt-1"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}>
              {finalPoints}
            </motion.p>
          </Card>

          <div className="flex flex-col gap-3">
            <Button fullWidth size="lg" onClick={handleNewSeason} loading={starting}>
              <RefreshCw size={18} /> Nova Temporada {career.season + 1}
            </Button>
            <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
              <Home size={16} /> Voltar ao Início
            </Button>
          </div>
        </div>

        <AchievementToast achievementId={newAchievement} onDismiss={() => setNewAchievement(null)} />
      </div>
    </PageTransition>
  );
}
