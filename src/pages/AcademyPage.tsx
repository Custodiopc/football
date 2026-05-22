import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { Layout } from '../components/Layout';
import { DataTable, type Column } from '../components/DataTable';
import { JuniorDetailModal } from '../components/JuniorDetailModal';
import { useCareerStore } from '../stores/careerStore';
import { formatRevealedHighlights } from '../lib/academy';
import { formatCurrency } from '../lib/finance';
import type { JuniorPlayer } from '../types/academy';
import { POS_COLOR } from '../types/academy';

// Barra de desenvolvimento inline
function DevBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#f5d020' : '#3b9adb';
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: 60, height: 8, backgroundColor: '#0d1f36', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{Math.round(pct)}%</span>
    </div>
  );
}

// Estrelas CPE
function CpeDisplay({ stars }: { stars: number }) {
  return (
    <span style={{ fontSize: 11, color: '#f5d020', letterSpacing: -1 }}>
      {'★'.repeat(stars)}<span style={{ color: '#1e3a5c' }}>{'★'.repeat(5 - stars)}</span>
    </span>
  );
}

export function AcademyPage() {
  const navigate = useNavigate();
  const {
    career,
    promoteJuniorAction,
    dismissJuniorAction,
    setJuniorNicknameAction,
  } = useCareerStore();

  const [selectedJunior, setSelectedJunior] = useState<JuniorPlayer | null>(null);

  if (!career?.academy) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Users size={36} style={{ color: '#1e3a5c' }} />
          <p style={{ color: '#6b7c93', fontSize: 13 }}>
            Academia não disponível. Inicie uma nova carreira.
          </p>
        </div>
      </Layout>
    );
  }

  const { academy } = career;
  const juniors = academy.juniors;
  const occupied = juniors.length;
  const capacity = academy.capacity;

  // Colunas estilo Brasfoot tela 10
  const columns: Column<JuniorPlayer>[] = [
    {
      key: 'pos', label: 'P', width: 24, align: 'center',
      render: (j) => (
        <span style={{ fontWeight: 700, fontSize: 11, color: POS_COLOR[j.position] ?? '#a8b8cc' }}>
          {j.position}
        </span>
      ),
    },
    {
      key: 'pais', label: 'País', width: 36, align: 'center',
      render: (j) => (
        <span style={{ fontSize: 10, color: '#a8b8cc' }}>{j.country}</span>
      ),
    },
    {
      key: 'name', label: 'Nome', align: 'left',
      sortable: true, sortValue: (j) => j.nickname ?? j.full_name,
      render: (j) => (
        <span style={{ color: '#f5f5f0', fontWeight: 500, fontSize: 12 }}>
          {j.nickname ?? j.full_name}
        </span>
      ),
    },
    {
      key: 'age', label: 'Id.', width: 28, align: 'center',
      sortable: true, sortValue: (j) => j.age,
      render: (j) => <span style={{ color: '#a8b8cc' }}>{j.age}</span>,
    },
    {
      key: 'side', label: 'L', width: 22, align: 'center',
      render: (j) => <span style={{ color: '#6b7c93', fontSize: 10 }}>{j.side}</span>,
    },
    {
      key: 'dev', label: 'Desenvolvimento', width: 110, align: 'left',
      sortable: true, sortValue: (j) => j.development_percent,
      render: (j) => <DevBar pct={j.development_percent} />,
    },
    {
      key: 'cpe', label: 'CPE', width: 64, align: 'center',
      sortable: true, sortValue: (j) => j.cpe_stars,
      render: (j) => <CpeDisplay stars={j.cpe_stars} />,
    },
    {
      key: 'force', label: 'F', width: 26, align: 'center',
      sortable: true, sortValue: (j) => j.current_force,
      render: (j) => (
        <span style={{ fontWeight: 700, color: '#f5d020', fontSize: 11 }}>
          {j.current_force}
        </span>
      ),
    },
    {
      key: 'car', label: 'Car.', width: 52, align: 'center',
      render: (j) => {
        const h = formatRevealedHighlights(j);
        return (
          <span style={{ fontSize: 10, color: h !== '—' ? '#f5d020' : '#6b7c93' }}>
            {h}
          </span>
        );
      },
    },
    {
      key: 'value', label: 'Valor', width: 64, align: 'right',
      sortable: true, sortValue: (j) => j.estimated_value,
      render: (j) => (
        <span style={{ fontSize: 10, color: '#a8b8cc' }}>
          {formatCurrency(j.estimated_value)}
        </span>
      ),
    },
    {
      key: 'wage', label: 'Salário', width: 60, align: 'right',
      render: (j) => (
        <span style={{ fontSize: 10, color: '#6b7c93' }}>
          {formatCurrency(j.weekly_wage)}/s
        </span>
      ),
    },
  ];

  const occupancyColor = occupied >= capacity
    ? '#ef4444'
    : occupied >= capacity * 0.8
      ? '#f5d020'
      : '#4ade80';

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/single/career')}
              style={{ color: '#a8b8cc', cursor: 'pointer', border: 'none', background: 'none' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-retro text-xl" style={{ color: '#f5d020' }}>
                Academia de Juniores
              </h1>
              <p style={{ fontSize: 11, color: '#a8b8cc' }}>
                Vagas:{' '}
                <span style={{ color: occupancyColor, fontWeight: 700 }}>
                  {occupied}/{capacity}
                </span>
                {' '}· Clique num júnior para ver detalhes
              </p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {juniors.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <Users size={40} style={{ color: '#1e3a5c' }} />
            <p style={{ color: '#6b7c93', fontSize: 13 }}>
              Nenhum jovem na academia no momento.
            </p>
            <p style={{ color: '#1e3a5c', fontSize: 11 }}>
              Olheiros descobrem novos talentos a cada 5 rodadas simuladas.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <DataTable<JuniorPlayer>
              columns={columns}
              data={juniors}
              onRowClick={(j) => setSelectedJunior(j)}
              selectedRow={selectedJunior}
              selectedKey={(j) => j.id}
              density="compact"
              zebraStripe
            />
          </div>
        )}

        {/* Legenda */}
        <div
          className="px-4 py-2 shrink-0"
          style={{ borderTop: '1px solid #1e3a5c', backgroundColor: '#0d1f36' }}
        >
          <div className="flex flex-wrap gap-4" style={{ fontSize: 10, color: '#6b7c93' }}>
            <span>Dev: barra = % de desenvolvimento até o potencial máximo</span>
            <span>CPE: estimativa dos olheiros (1-5 ★)</span>
            <span>Car.: características reveladas</span>
            <span>Olheiros descobrem novos talentos a cada 5 rodadas</span>
          </div>
        </div>
      </div>

      {/* Modal de detalhe */}
      <JuniorDetailModal
        junior={selectedJunior}
        onClose={() => setSelectedJunior(null)}
        onPromote={async (id) => {
          const result = await promoteJuniorAction(id);
          return result;
        }}
        onDismiss={async (id) => {
          await dismissJuniorAction(id);
          setSelectedJunior(null);
        }}
        onSetNickname={async (id, nickname) => {
          await setJuniorNicknameAction(id, nickname);
          // Atualizar selecionado localmente
          const updated = career.academy?.juniors.find((j) => j.id === id);
          if (updated) setSelectedJunior({ ...updated, nickname: nickname || undefined });
        }}
      />
    </Layout>
  );
}
