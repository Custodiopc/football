import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { Button } from '../components/Button';
import { TeamBadge } from '../components/TeamBadge';
import { useCareerStore } from '../stores/careerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useWorldStore } from '../stores/worldStore';
import { TEAMS } from '../data';
import { createCareer } from '../lib/career';
import type { Difficulty, Team } from '../types';

const DIFFICULTIES: { key: Difficulty; label: string; color: string }[] = [
  { key: 'easy',   label: 'Fácil',   color: '#4ade80' },
  { key: 'normal', label: 'Normal',  color: '#f5d020' },
  { key: 'hard',   label: 'Difícil', color: '#ef4444' },
];

// Times da Série A (playable)
const SERIE_A_TEAMS = TEAMS.slice(0, 20);

export function AddCoach() {
  const navigate = useNavigate();
  const nickname = useSettingsStore((s) => s.nickname) ?? '';
  const { startCareer } = useCareerStore();
  const worldConfig = useWorldStore((s) => s.config);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [randomize, setRandomize] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRandomTeam = () => {
    const t = SERIE_A_TEAMS[Math.floor(Math.random() * SERIE_A_TEAMS.length)];
    setSelectedTeam(t);
    setRandomize(true);
  };

  const handleStart = async () => {
    const team = selectedTeam ?? (randomize ? null : null);
    if (!team) return;
    setLoading(true);
    try {
      const career = createCareer({
        nickname,
        team_id: team.id,
        difficulty,
        season: worldConfig.start_season,
      });
      await startCareer(career);
      navigate('/single/career');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0a1e35', color: '#f5f5f0' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
      >
        <button
          onClick={() => navigate('/setup')}
          style={{ color: '#a8b8cc', cursor: 'pointer', border: 'none', background: 'none' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-retro text-xl" style={{ color: '#f5d020' }}>
          Adicionar Técnico Humano
        </h1>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto" style={{ maxWidth: 520 }}>

          {/* Info do técnico */}
          <div
            className="rounded mb-4 px-4 py-3"
            style={{ backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}
          >
            <div style={{ fontSize: 12, color: '#a8b8cc', marginBottom: 4 }}>Técnico</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f5f0' }}>
              {nickname || '—'}
            </div>
            <div style={{ fontSize: 11, color: '#6b7c93', marginTop: 2 }}>
              Treinar time no Brasil · Série A {worldConfig.start_season}
            </div>
          </div>

          {/* Dificuldade */}
          <div className="mb-4">
            <div style={{ fontSize: 11, color: '#a8b8cc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Dificuldade
            </div>
            <div className="flex gap-2">
              {DIFFICULTIES.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className="flex-1 rounded py-2 transition-all"
                  style={{
                    fontSize: 12, fontWeight: difficulty === key ? 700 : 400, cursor: 'pointer',
                    backgroundColor: difficulty === key ? `${color}22` : '#15304f',
                    color: difficulty === key ? color : '#6b7c93',
                    border: difficulty === key ? `1px solid ${color}` : '1px solid #1e3a5c',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Escolha de time */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontSize: 11, color: '#a8b8cc', textTransform: 'uppercase', letterSpacing: 1 }}>
                Escolher Time — Série A
              </div>
              <button
                onClick={handleRandomTeam}
                className="flex items-center gap-1.5 rounded px-3 py-1"
                style={{
                  fontSize: 11, color: '#f5d020', cursor: 'pointer',
                  backgroundColor: 'rgba(245,208,32,0.1)', border: '1px solid rgba(245,208,32,0.2)',
                }}
              >
                <Shuffle size={12} /> Aleatório
              </button>
            </div>

            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}
            >
              {SERIE_A_TEAMS.map((team) => {
                const selected = selectedTeam?.id === team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => { setSelectedTeam(team); setRandomize(false); }}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-left transition-all"
                    style={{
                      backgroundColor: selected ? 'rgba(245,208,32,0.12)' : '#15304f',
                      border: selected ? '1px solid #f5d020' : '1px solid #1e3a5c',
                      cursor: 'pointer',
                    }}
                  >
                    <TeamBadge
                      shortName={team.short_name}
                      primaryColor={team.primary_color}
                      size={28}
                    />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: selected ? '#f5d020' : '#f5f5f0' }}>
                        {team.short_name}
                      </div>
                      <div style={{ fontSize: 9, color: '#6b7c93' }}>{team.city.slice(0, 10)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview do time selecionado */}
          {selectedTeam && (
            <div
              className="flex items-center gap-3 rounded px-4 py-3 mb-4"
              style={{ backgroundColor: 'rgba(245,208,32,0.06)', border: '1px solid rgba(245,208,32,0.2)' }}
            >
              <TeamBadge
                shortName={selectedTeam.short_name}
                primaryColor={selectedTeam.primary_color}
                size={40}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f0' }}>
                  {selectedTeam.name}
                </div>
                <div style={{ fontSize: 11, color: '#a8b8cc' }}>
                  {selectedTeam.city}, {selectedTeam.state}
                </div>
              </div>
            </div>
          )}

          {/* Torneio amistoso (stub) */}
          <div
            className="rounded px-4 py-3 mb-6"
            style={{ backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a8b8cc', marginBottom: 4 }}>
              Torneio Amistoso?
            </div>
            <p style={{ fontSize: 11, color: '#6b7c93', lineHeight: 1.5 }}>
              Disponível em breve. Gerará mini-torneio com os times escolhidos antes do início da temporada.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: '#0d1f36', borderTop: '1px solid #1e3a5c' }}
      >
        <Button variant="secondary" onClick={() => navigate('/setup')}>
          <ArrowLeft size={14} /> Voltar
        </Button>
        <Button onClick={handleStart} loading={loading} disabled={!selectedTeam}>
          {selectedTeam ? `Iniciar com ${selectedTeam.short_name}` : 'Escolha um time'} »
        </Button>
      </div>
    </div>
  );
}
