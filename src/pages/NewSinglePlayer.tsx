import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { TeamBadge } from '../components/TeamBadge';
import { TEAMS, getTeamOverall } from '../data';
import { useCareerStore } from '../stores/careerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { createCareer } from '../lib/career';
import type { Team, Difficulty } from '../types';

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'easy',   label: 'Fácil',   desc: 'IA mais fraca, mercado favorável.',   color: '#4ade80' },
  { key: 'normal', label: 'Normal',  desc: 'Experiência balanceada.',             color: '#f5d020' },
  { key: 'hard',   label: 'Difícil', desc: 'IA competitiva, orçamento apertado.', color: '#ef4444' },
];

export function NewSinglePlayer() {
  const navigate = useNavigate();
  const nickname = useSettingsStore((s) => s.nickname);
  const { startCareer } = useCareerStore();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedTeam || !nickname) return;
    setLoading(true);
    const career = createCareer({ nickname, team_id: selectedTeam.id, difficulty });
    await startCareer(career);
    navigate('/single/career');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a1e35' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
      >
        <button
          onClick={() => navigate('/')}
          className="rounded p-1.5 transition-colors"
          style={{ color: '#a8b8cc', backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-retro text-2xl tracking-wide" style={{ color: '#f5d020' }}>
            Escolha seu Time
          </h1>
          <p style={{ color: '#6b7c93', fontSize: 12 }}>Brasileirão Série A 2026</p>
        </div>
      </div>

      {/* Botão configurações avançadas */}
      <div className="px-4 py-2 flex justify-end" style={{ borderBottom: '1px solid #1e3a5c' }}>
        <button
          onClick={() => navigate('/setup')}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors"
          style={{ fontSize: 11, color: '#a8b8cc', backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', cursor: 'pointer' }}
        >
          <Settings2 size={12} /> Configurações Avançadas
        </button>
      </div>

      {/* Grid de times */}
      <div className="p-4 grid grid-cols-4 sm:grid-cols-5 gap-2" style={{ maxWidth: 900 }}>
        {TEAMS.map((team) => {
          const overall = getTeamOverall(team.id);
          const selected = selectedTeam?.id === team.id;
          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="flex flex-col items-center gap-2 rounded p-2 transition-all"
              style={{
                backgroundColor: selected ? 'rgba(245,208,32,0.12)' : '#15304f',
                border: selected ? '2px solid #f5d020' : '1px solid #1e3a5c',
                cursor: 'pointer',
                transform: selected ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <TeamBadge shortName={team.short_name} primaryColor={team.primary_color} size={40} />
              <div className="text-center">
                <div className="font-bold" style={{ color: '#f5f5f0', fontSize: 11 }}>
                  {team.short_name}
                </div>
                <div style={{ color: '#6b7c93', fontSize: 10 }}>{team.city}</div>
                <div className="font-bold" style={{ color: '#f5d020', fontSize: 12 }}>
                  {overall}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal confirmação */}
      <Modal
        open={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title="Confirmar Escolha"
      >
        {selectedTeam && (
          <div className="flex flex-col gap-5">
            {/* Info do time */}
            <div className="flex items-center gap-4">
              <TeamBadge shortName={selectedTeam.short_name} primaryColor={selectedTeam.primary_color} size={52} />
              <div>
                <div className="font-bold" style={{ color: '#f5f5f0', fontSize: 16 }}>
                  {selectedTeam.short_name}
                </div>
                <div style={{ color: '#a8b8cc', fontSize: 13 }}>
                  {selectedTeam.city}, {selectedTeam.state}
                </div>
                <div className="font-retro text-xl" style={{ color: '#f5d020' }}>
                  ★ {getTeamOverall(selectedTeam.id)} overall
                </div>
              </div>
            </div>

            {/* Dificuldade */}
            <div>
              <p style={{ color: '#a8b8cc', fontSize: 13, marginBottom: 8 }}>Dificuldade</p>
              <div className="flex flex-col gap-2">
                {DIFFICULTIES.map(({ key, label, desc, color }) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className="flex items-start gap-3 rounded p-3 text-left transition-all"
                    style={{
                      backgroundColor: difficulty === key ? 'rgba(245,208,32,0.1)' : '#0d1f36',
                      border: difficulty === key ? `1px solid ${color}` : '1px solid #1e3a5c',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color, fontWeight: 700, fontSize: 13, minWidth: 60 }}>{label}</span>
                    <span style={{ color: '#a8b8cc', fontSize: 12 }}>{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button fullWidth variant="secondary" onClick={() => setSelectedTeam(null)}>
                Cancelar
              </Button>
              <Button fullWidth onClick={handleConfirm} loading={loading}>
                Começar! »
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
