import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar, Building2, Users,
  Search, ShoppingCart, UserCog, History, Settings, Menu, X,
  DollarSign,
} from 'lucide-react';
import { TeamBadge } from './TeamBadge';
import { EnergyBar } from './EnergyBar';
import { CompetitionBadge } from './CompetitionBadge';
import { PlayerInfoCard } from './PlayerInfoCard';
import { formatCurrencyShort } from '../lib/finance';
import { useCareerStore } from '../stores/careerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getTeamById } from '../data';
import { getUserMatch } from '../lib/calendar';
import { sortStandings } from '../lib/simulation/engine';
import type { Player } from '../types';

interface NavItem {
  label: string;
  icon: ReactNode;
  route: string;
  placeholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Agenda',   icon: <Calendar size={20} />,  route: '/single/career' },
  { label: 'Finanças', icon: <DollarSign size={20} />, route: '/career/finances' },
  { label: 'Estádio',  icon: <Building2 size={20} />, route: '/career/stadium' },
  { label: 'Juniores', icon: <Users size={20} />,     route: '/career/academy' },
  { label: 'Mercado',  icon: <ShoppingCart size={20} />, route: '/career/market' },
  { label: 'Procura',  icon: <Search size={20} />,    route: '/career/search' },
  { label: 'Técnicos', icon: <UserCog size={20} />,   route: '/single/career', placeholder: true },
  { label: 'História', icon: <History size={20} />,   route: '/single/career', placeholder: true },
  { label: 'Opções',   icon: <Settings size={20} />,  route: '/settings' },
];

interface LayoutProps {
  children: ReactNode;
  selectedPlayer?: Player | null;
}

export function Layout({ children, selectedPlayer }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { career } = useCareerStore();
  const { nickname } = useSettingsStore();

  const team = career ? getTeamById(career.team_id) : null;
  const round = career?.current_round ?? 1;

  // Próximo jogo
  const nextMatch = career
    ? getUserMatch(career.matches, round, career.team_id)
    : null;
  const oppId = nextMatch
    ? (nextMatch.home_team_id === career?.team_id ? nextMatch.away_team_id : nextMatch.home_team_id)
    : null;
  const opp = oppId ? getTeamById(oppId) : null;
  const isHome = nextMatch?.home_team_id === career?.team_id;

  // Posição na tabela
  const sortedStandings = career ? sortStandings(career.standings) : [];
  const pos = sortedStandings.findIndex((r) => r.team_id === career?.team_id) + 1;

  // Data do jogo (simulada como rodada → data aproximada)
  const now = new Date();
  const gameDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const playerState = selectedPlayer
    ? career?.player_states.find((s) => s.player_id === selectedPlayer.id)
    : undefined;

  const hasLineup = career?.lineups.some((l) => l.round === round) ?? false;

  const SidebarContent = () => (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full" style={{ fontSize: 13 }}>
      {/* Escudo + time */}
      {team ? (
        <div className="flex items-center gap-2.5">
          <TeamBadge shortName={team.short_name} primaryColor={team.primary_color} size={44} />
          <div className="min-w-0">
            <div className="font-bold truncate" style={{ color: '#f5d020', fontSize: 14 }}>
              {team.short_name}
            </div>
            <div className="truncate text-xxs" style={{ color: '#a8b8cc' }}>
              {nickname ?? '—'} · {pos}º lugar
            </div>
          </div>
        </div>
      ) : (
        <div className="skeleton h-10 rounded" />
      )}

      <div style={{ borderTop: '1px solid #1e3a5c' }} />

      {/* Financeiro — Fase 9 */}
      <div
        className="flex items-center justify-between rounded px-2 py-1.5 cursor-pointer"
        style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c' }}
        onClick={() => navigate('/career/finances')}
      >
        <span className="flex items-center gap-1.5" style={{ color: '#a8b8cc', fontSize: 12 }}>
          <DollarSign size={13} style={{ color: (career?.finances?.cash_balance ?? 0) >= 0 ? '#4ade80' : '#ef4444' }} />
          Caixa
        </span>
        <span className="font-semibold" style={{
          color: (career?.finances?.cash_balance ?? 0) >= 0 ? '#4ade80' : '#ef4444', fontSize: 12
        }}>
          {career?.finances?.cash_balance != null
            ? formatCurrencyShort(career.finances.cash_balance)
            : '—'}
        </span>
      </div>

      {/* Confiança diretoria */}
      <div>
        <div className="flex justify-between mb-1" style={{ color: '#a8b8cc', fontSize: 11 }}>
          <span>Confiança diretoria</span><span style={{ color: '#f5f5f0' }}>95%</span>
        </div>
        <EnergyBar value={95} width={undefined as unknown as number} showLabel={false} />
      </div>

      {/* Confiança torcida */}
      <div>
        <div className="flex justify-between mb-1" style={{ color: '#a8b8cc', fontSize: 11 }}>
          <span>Confiança torcida</span><span style={{ color: '#f5f5f0' }}>85%</span>
        </div>
        <EnergyBar value={85} width={undefined as unknown as number} showLabel={false} />
      </div>

      {/* Próximo jogo */}
      {opp && (
        <>
          <div style={{ borderTop: '1px solid #1e3a5c' }} />
          <CompetitionBadge
            name="Brasileirão Série A"
            round={`Rodada ${round} · ${isHome ? 'Casa' : 'Fora'}`}
          />
          <div
            className="flex items-center gap-2 rounded px-2 py-2"
            style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c' }}
          >
            <TeamBadge shortName={opp.short_name} primaryColor={opp.primary_color} size={28} />
            <div className="min-w-0">
              <div className="truncate font-medium" style={{ color: '#f5f5f0', fontSize: 12 }}>
                vs {opp.short_name}
              </div>
              <div style={{ color: '#a8b8cc', fontSize: 10 }}>{isHome ? 'Mandante' : 'Visitante'}</div>
            </div>
          </div>
        </>
      )}

      {/* Botão Escalar Time */}
      {career && (
        <>
          <div style={{ borderTop: '1px solid #1e3a5c' }} />
          <button
            onClick={() => { navigate('/single/career/lineup'); setDrawerOpen(false); }}
            className="w-full rounded py-2 font-semibold transition-all"
            style={{
              backgroundColor: hasLineup ? '#1e3a5c' : '#f5d020',
              color: hasLineup ? '#a8b8cc' : '#0a1e35',
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {hasLineup ? '✓ Escalação OK' : '⚠ Escalar Time'}
          </button>
        </>
      )}

      {/* PlayerInfoCard quando jogador selecionado */}
      {selectedPlayer && (
        <>
          <div style={{ borderTop: '1px solid #1e3a5c' }} />
          <PlayerInfoCard
            player={selectedPlayer}
            playerState={playerState}
            currentRound={round}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#0a1e35', color: '#f5f5f0' }}>

      {/* ── Top Nav ─────────────────────────────────────────── */}
      <nav
        className="flex items-center shrink-0 z-30"
        style={{
          height: 60,
          background: 'linear-gradient(180deg, #15304f, #0d1f36)',
          borderBottom: '1px solid #1e3a5c',
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Hamburger mobile */}
        <button
          className="md:hidden flex items-center justify-center"
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{ width: 60, height: 60, color: '#a8b8cc', flexShrink: 0 }}
        >
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <div
          className="hidden md:flex items-center px-4"
          style={{ width: 280, flexShrink: 0, borderRight: '1px solid #1e3a5c', height: 60 }}
        >
          <span className="font-retro text-2xl tracking-widest" style={{ color: '#f5d020' }}>
            TREINADOR BR
          </span>
        </div>

        {/* Nav items */}
        <div className="flex items-center flex-1 overflow-x-auto px-2 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.route && !item.placeholder;
            return (
              <button
                key={item.label}
                onClick={() => !item.placeholder && navigate(item.route)}
                title={item.placeholder ? `${item.label} (Fase futura)` : item.label}
                className="flex flex-col items-center justify-center rounded transition-colors shrink-0"
                style={{
                  width: 56,
                  height: 52,
                  color: active ? '#f5d020' : item.placeholder ? '#6b7c93' : '#a8b8cc',
                  backgroundColor: active ? 'rgba(245,208,32,0.12)' : 'transparent',
                  border: 'none',
                  cursor: item.placeholder ? 'not-allowed' : 'pointer',
                  gap: 2,
                  opacity: item.placeholder ? 0.6 : 1,
                }}
              >
                {item.icon}
                <span style={{ fontSize: 9, lineHeight: 1, fontWeight: 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Data atual */}
        <div
          className="hidden sm:flex items-center px-4 shrink-0"
          style={{ color: '#f5d020', fontFamily: 'VT323, monospace', fontSize: 18, letterSpacing: 1 }}
        >
          {gameDate}
        </div>
      </nav>

      {/* ── Layout body ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Sidebar desktop */}
        <aside
          className="hidden md:flex flex-col shrink-0"
          style={{
            width: 280,
            borderRight: '1px solid #1e3a5c',
            backgroundColor: '#0d1f36',
            height: 'calc(100vh - 60px)',
            position: 'sticky',
            top: 60,
            overflowY: 'auto',
          }}
        >
          <SidebarContent />
        </aside>

        {/* Drawer mobile */}
        {drawerOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/60"
              onClick={() => setDrawerOpen(false)}
              style={{ top: 60 }}
            />
            <aside
              className="md:hidden fixed left-0 z-50 flex flex-col"
              style={{
                top: 60,
                bottom: 0,
                width: 280,
                backgroundColor: '#0d1f36',
                borderRight: '1px solid #1e3a5c',
                overflowY: 'auto',
              }}
            >
              <SidebarContent />
            </aside>
          </>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
