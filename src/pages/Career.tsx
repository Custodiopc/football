import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, BarChart3, Users, MoreVertical,
  CheckCircle, AlertCircle, Play, AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Layout } from '../components/Layout';
import { DataTable, type Column } from '../components/DataTable';
import { EnergyBar } from '../components/EnergyBar';
import { StandingsTable } from '../components/StandingsTable';
import { MatchCalendar } from '../components/MatchCalendar';
import { PlayerDetailModal } from '../components/PlayerDetailModal';
import { useCareerStore } from '../stores/careerStore';
import { getPlayersByTeam, getTeamById } from '../data';
import { sortStandings, buildLiveSimulation } from '../lib/simulation/engine';
import { formatHighlights } from '../lib/simulation/playerAttributes';
import { playClick } from '../lib/sound';
import type { Player } from '../types';

type Tab = 'elenco' | 'calendario' | 'tabela';

// Posição abreviada V2
const POS_ABBR: Record<string, string> = { G: 'G', Z: 'Z', L: 'L', M: 'M', A: 'A' };
const POS_COLOR: Record<string, string> = {
  G: '#3b9adb', Z: '#4ade80', L: '#a8b8cc', M: '#f5d020', A: '#ef4444',
};

export function Career() {
  const navigate = useNavigate();
  const {
    career, hydrated, clearCareer,
    legacySaveDetected, dismissLegacyWarning, setPendingLiveMatch,
  } = useCareerStore();

  const [tab, setTab] = useState<Tab>('elenco');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);

  const lastResult = useCareerStore((s) => s.lastResult);
  useEffect(() => {
    if (lastResult) navigate('/single/career/result');
  }, [lastResult, navigate]);

  useEffect(() => {
    if (hydrated && !career && !legacySaveDetected) navigate('/');
  }, [hydrated, career, legacySaveDetected, navigate]);

  // Aviso de save legado
  if (hydrated && legacySaveDetected) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: '#0a1e35' }}
      >
        <div
          className="rounded-xl p-6 text-center max-w-sm w-full"
          style={{ backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}
        >
          <AlertTriangle size={36} style={{ color: '#f5d020', margin: '0 auto 12px' }} />
          <h2 className="font-retro text-2xl" style={{ color: '#f5d020' }}>
            Save Incompatível
          </h2>
          <p style={{ color: '#a8b8cc', fontSize: 13, margin: '12px 0' }}>
            Seu save foi criado antes da atualização do sistema de atributos (V2).
            É necessário começar uma nova carreira.
          </p>
          <p style={{ color: '#6b7c93', fontSize: 11, marginBottom: 20 }}>
            Desculpe pelo inconveniente! O novo sistema Brasfoot é muito mais rico.
          </p>
          <div className="flex flex-col gap-2">
            <Button fullWidth onClick={async () => { await dismissLegacyWarning(); navigate('/single/new'); }}>
              Começar Nova Carreira
            </Button>
            <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated || !career) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0a1e35' }}>
        <span className="font-retro text-xl" style={{ color: '#f5d020' }}>Carregando...</span>
      </div>
    );
  }

  if (career.status === 'finished') { navigate('/single/career/season-end'); return null; }

  const round = career.current_round;
  const teamPlayers = getPlayersByTeam(career.team_id);
  const currentLineup = career.lineups.find((l) => l.round === round);
  const hasLineup = !!currentLineup;
  const sortedStandings = sortStandings(career.standings);

  const handleSimulate = async () => {
    if (!currentLineup) return;
    playClick();
    setSimulating(true);
    try {
      const team = getTeamById(career.team_id);
      if (!team) return;
      // Pré-calcular jogo completo e navegar para transmissão ao vivo
      const liveMatch = buildLiveSimulation(career, currentLineup, team);
      setPendingLiveMatch(liveMatch);
      navigate('/career/match-live');
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  // ── Colunas da tabela de elenco V2 ──────────────────────────
  const squadColumns: Column<Player>[] = [
    {
      key: 'pos', label: 'P', width: 26, align: 'center', sticky: true,
      render: (p) => (
        <span style={{ fontWeight: 700, fontSize: 11, color: POS_COLOR[p.position] ?? '#a8b8cc' }}>
          {POS_ABBR[p.position] ?? p.position}
        </span>
      ),
    },
    {
      key: 'side', label: 'L', width: 22, align: 'center',
      render: (p) => <span style={{ color: '#6b7c93', fontSize: 10 }}>{p.side}</span>,
    },
    {
      key: 'name', label: 'Nome', align: 'left', sticky: true,
      sortable: true, sortValue: (p) => p.name,
      render: (p) => (
        <span style={{ color: selectedPlayer?.id === p.id ? '#0a1e35' : '#f5f5f0', fontWeight: 500 }}>
          {p.name}
          {p.is_world_top && <span style={{ marginLeft: 3 }}>🌟</span>}
          {p.is_star && !p.is_world_top && <span style={{ marginLeft: 3, fontSize: 10 }}>⭐</span>}
        </span>
      ),
    },
    {
      key: 'force', label: 'F', width: 28, align: 'center',
      sortable: true, sortValue: (p) => p.force,
      render: (p) => (
        <span style={{ fontWeight: 700, color: '#f5d020', fontSize: 12 }}>{p.force}</span>
      ),
    },
    {
      key: 'energy', label: 'Energia', width: 88, align: 'center',
      render: (p) => {
        const ps = career.player_states.find((s) => s.player_id === p.id);
        return <EnergyBar value={ps?.fitness ?? 100} width={80} />;
      },
    },
    {
      key: 'highlights', label: 'Car.', width: 64, align: 'center',
      render: (p) => (
        <span style={{
          fontSize: 10,
          color: (p.highlighted_attr_1 || p.highlighted_attr_2) ? '#f5d020' : '#6b7c93',
          fontWeight: 600,
        }}>
          {formatHighlights(p)}
        </span>
      ),
    },
    {
      key: 'goals', label: 'G', width: 28, align: 'center',
      sortable: true, sortValue: (p) => career.player_states.find((s) => s.player_id === p.id)?.goals_season ?? 0,
      render: (p) => {
        const gs = career.player_states.find((s) => s.player_id === p.id)?.goals_season ?? 0;
        return <span style={{ color: gs > 0 ? '#4ade80' : '#6b7c93' }}>{gs}</span>;
      },
    },
    {
      key: 'age', label: 'Idade', width: 44, align: 'center',
      sortable: true, sortValue: (p) => p.age,
      render: (p) => <span style={{ color: '#a8b8cc' }}>{p.age}</span>,
    },
    {
      key: 'status', label: 'Status', width: 56, align: 'center',
      render: (p) => {
        const ps = career.player_states.find((s) => s.player_id === p.id);
        if (ps?.injury_until_round != null && round <= ps.injury_until_round)
          return <span style={{ color: '#ef4444', fontSize: 10 }}>Lesão</span>;
        if (ps?.suspended_until_round != null && round <= ps.suspended_until_round)
          return <span style={{ color: '#f5d020', fontSize: 10 }}>Susp.</span>;
        return <span style={{ color: '#4ade80', fontSize: 10 }}>OK</span>;
      },
    },
  ];

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'elenco',     label: 'Elenco',     icon: <Users size={14} /> },
    { key: 'calendario', label: 'Calendário', icon: <Calendar size={14} /> },
    { key: 'tabela',     label: 'Tabela',     icon: <BarChart3 size={14} /> },
  ];

  return (
    <Layout selectedPlayer={selectedPlayer}>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>

        {/* Sub-header */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
        >
          <div className="flex gap-1">
            {TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors"
                style={{
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  backgroundColor: tab === key ? 'rgba(245,208,32,0.15)' : 'transparent',
                  color: tab === key ? '#f5d020' : '#6b7c93',
                  border: 'none',
                  borderBottom: tab === key ? '2px solid #f5d020' : '2px solid transparent',
                }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {hasLineup ? (
              <Button size="sm" onClick={handleSimulate} loading={simulating}>
                <Play size={12} /> Simular R.{round}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => navigate('/single/career/lineup')}>
                <AlertCircle size={12} /> Escalar
              </Button>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded p-1.5"
              style={{ color: '#6b7c93', border: '1px solid #1e3a5c', backgroundColor: '#0d1f36' }}
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Banner status */}
        {!hasLineup ? (
          <div
            className="flex items-center gap-2 px-4 py-1.5 shrink-0"
            style={{ backgroundColor: 'rgba(245,208,32,0.06)', borderBottom: '1px solid #1e3a5c' }}
          >
            <AlertCircle size={13} style={{ color: '#f5d020' }} />
            <span style={{ color: '#f5d020', fontSize: 12 }}>
              Rodada {round} — Escale seu time antes de simular
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 px-4 py-1.5 shrink-0"
            style={{ backgroundColor: 'rgba(74,222,128,0.05)', borderBottom: '1px solid #1e3a5c' }}
          >
            <CheckCircle size={13} style={{ color: '#4ade80' }} />
            <span style={{ color: '#4ade80', fontSize: 12 }}>Escalação confirmada — clique em Simular</span>
          </div>
        )}

        {/* Conteúdo das tabs */}
        <div className="flex-1 overflow-auto">
          {tab === 'elenco' && (
            <DataTable<Player>
              columns={squadColumns}
              data={teamPlayers}
              onRowClick={(p) => {
                setSelectedPlayer(selectedPlayer?.id === p.id ? null : p);
                setDetailPlayer(p);
              }}
              selectedRow={selectedPlayer}
              selectedKey={(p) => p.id}
              density="compact"
              zebraStripe
            />
          )}

          {tab === 'calendario' && (
            <div className="p-3">
              <MatchCalendar matches={career.matches} userTeamId={career.team_id} currentRound={round} />
            </div>
          )}

          {tab === 'tabela' && (
            <div className="p-3">
              <StandingsTable standings={sortedStandings} userTeamId={career.team_id} />
            </div>
          )}
        </div>
      </div>

      {/* Modal detalhe do jogador */}
      <PlayerDetailModal
        player={detailPlayer}
        playerState={career.player_states.find((s) => s.player_id === detailPlayer?.id)}
        currentRound={round}
        onClose={() => setDetailPlayer(null)}
      />

      {/* Modal menu */}
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div className="flex flex-col gap-2">
          <Button fullWidth variant="secondary" onClick={() => { setMenuOpen(false); navigate('/'); }}>
            Salvar e sair
          </Button>
          <Button fullWidth variant="danger" onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}>
            Excluir carreira
          </Button>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir carreira?">
        <p style={{ fontSize: 13, color: '#a8b8cc', marginBottom: 16 }}>
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button fullWidth variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button fullWidth variant="danger" onClick={async () => { await clearCareer(); navigate('/'); }}>
            Excluir
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
