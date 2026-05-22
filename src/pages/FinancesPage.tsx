import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLAYERS } from '../data';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useCareerStore } from '../stores/careerStore';
import {
  formatCurrency, totalRevenue, totalExpenses, netBalance,
  takeLoan, repayLoan, maxLoanAmount, totalMonthlyWages,
} from '../lib/finance';

// ── Sub-componente: linha de valor ────────────────────────────

function FinRow({
  label, value, highlight = false, isTotal = false,
}: {
  label: string; value: number; highlight?: boolean; isTotal?: boolean;
}) {
  const color = isTotal
    ? (value >= 0 ? '#4ade80' : '#ef4444')
    : highlight
      ? '#f5f5f0'
      : '#a8b8cc';

  return (
    <div
      className="flex justify-between"
      style={{
        fontSize: isTotal ? 13 : 12,
        fontWeight: isTotal ? 700 : 400,
        padding: `${isTotal ? 6 : 3}px 0`,
        borderTop: isTotal ? '1px solid #1e3a5c' : 'none',
        marginTop: isTotal ? 4 : 0,
        color,
      }}
    >
      <span>{label}</span>
      <span style={{ color: isTotal ? (value >= 0 ? '#4ade80' : '#ef4444') : '#f5f5f0' }}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: '#a8b8cc',
      borderBottom: '1px solid #1e3a5c', paddingBottom: 4, marginBottom: 6,
      textTransform: 'uppercase', letterSpacing: 1,
    }}>
      {children}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────

export function FinancesPage() {
  const navigate = useNavigate();
  const { career, updateCareer } = useCareerStore();

  const [loanAmount, setLoanAmount] = useState(500_000);

  if (!career?.finances) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64" style={{ color: '#6b7c93', fontSize: 13 }}>
          Finanças não disponíveis. Inicie uma nova carreira.
        </div>
      </Layout>
    );
  }

  const { finances, player_states } = career;
  const totalRev  = totalRevenue(finances);
  const totalExp  = totalExpenses(finances);
  const net       = netBalance(finances);

  // Total mensal de salários (estimado)
  const monthlyWages = totalMonthlyWages(
    player_states
      .map((ps) => PLAYERS.find((p) => p.id === ps.player_id)?.force ?? 0)
      .filter((f: number) => f > 0)
  );

  const maxLoan = maxLoanAmount(finances);
  const canTakeLoan = maxLoan >= 500_000;
  const canRepay = finances.loan.principal > 0 && finances.cash_balance >= 500_000;

  const handleTakeLoan = async () => {
    const updated = takeLoan(finances, loanAmount);
    await updateCareer({ finances: updated });
  };

  const handleRepayLoan = async () => {
    const updated = repayLoan(finances, loanAmount);
    await updateCareer({ finances: updated });
  };

  const PANEL: React.CSSProperties = {
    backgroundColor: '#15304f', border: '1px solid #1e3a5c',
    borderRadius: 8, padding: '12px 14px', marginBottom: 12,
  };

  return (
    <Layout>
      <div className="p-4" style={{ maxWidth: 560 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/single/career')}
            style={{ color: '#a8b8cc', cursor: 'pointer', border: 'none', background: 'none' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-retro text-2xl" style={{ color: '#f5d020' }}>
              Finanças — {career.season}
            </h1>
            <p style={{ fontSize: 12, color: '#a8b8cc' }}>
              Caixa: <strong style={{ color: finances.cash_balance >= 0 ? '#4ade80' : '#ef4444' }}>
                {formatCurrency(finances.cash_balance)}
              </strong>
            </p>
          </div>
        </div>

        {/* Receitas */}
        <div style={PANEL}>
          <SectionTitle>
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />
            Receitas
          </SectionTitle>
          <FinRow label="Ingressos"            value={finances.revenue.tickets} />
          <FinRow label="Venda de jogadores"   value={finances.revenue.player_sales} />
          <FinRow label="Prêmios"              value={finances.revenue.prizes} />
          <FinRow label="Patrocínio / Sócio"   value={finances.revenue.sponsorship} highlight />
          <FinRow label="Multas / outros"       value={finances.revenue.others} />
          <FinRow label="Total de receitas"     value={totalRev} isTotal />
        </div>

        {/* Despesas */}
        <div style={PANEL}>
          <SectionTitle>
            <TrendingDown size={12} style={{ display: 'inline', marginRight: 4 }} />
            Despesas
          </SectionTitle>
          <FinRow label="Compra de jogadores"  value={finances.expenses.player_purchases} />
          <FinRow label="Estádio"              value={finances.expenses.stadium} />
          <FinRow label="Salários"             value={finances.expenses.wages} />
          <FinRow label="Juros de empréstimo"  value={finances.expenses.loan_interest} />
          <FinRow label="Multa de rescisão"    value={finances.expenses.rescission_fines} />
          <FinRow label="Diversos"             value={finances.expenses.others} />
          <FinRow label="Total de despesas"    value={totalExp} isTotal />
        </div>

        {/* Saldo */}
        <div style={{ ...PANEL, border: `1px solid ${net >= 0 ? '#4ade80' : '#ef4444'}44` }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#a8b8cc' }}>Saldo da temporada</span>
            <span style={{ fontSize: 16, fontFamily: 'VT323, monospace', color: net >= 0 ? '#4ade80' : '#ef4444' }}>
              {formatCurrency(net)}
            </span>
          </div>
        </div>

        {/* Resumo mensal */}
        <div style={PANEL}>
          <SectionTitle>
            <Minus size={12} style={{ display: 'inline', marginRight: 4 }} />
            Resumo Mensal
          </SectionTitle>
          <div className="flex justify-between" style={{ fontSize: 12, color: '#a8b8cc' }}>
            <span>Total de salários/mês</span>
            <span style={{ color: '#f5f5f0', fontWeight: 600 }}>{formatCurrency(monthlyWages)}</span>
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 12, color: '#a8b8cc' }}>
            <span>Patrocínio/semana</span>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>
              {formatCurrency(finances.sponsorship.weekly_amount)}
            </span>
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 12, color: '#a8b8cc' }}>
            <span>Contrato patrocínio até</span>
            <span style={{ color: '#f5f5f0' }}>
              Rodada {finances.sponsorship.contract_until_round}
            </span>
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 12, color: '#a8b8cc' }}>
            <span>Dinheiro em caixa</span>
            <span style={{ color: finances.cash_balance >= 0 ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
              {formatCurrency(finances.cash_balance)}
            </span>
          </div>
        </div>

        {/* Empréstimo bancário */}
        <div style={PANEL}>
          <SectionTitle>Empréstimo Bancário</SectionTitle>

          <div className="flex flex-col gap-1 mb-3" style={{ fontSize: 12 }}>
            <div className="flex justify-between">
              <span style={{ color: '#a8b8cc' }}>Valor já emprestado</span>
              <span style={{ color: finances.loan.principal > 0 ? '#ef4444' : '#6b7c93', fontWeight: 600 }}>
                {formatCurrency(finances.loan.principal)}
              </span>
            </div>
            {finances.loan.principal > 0 && (
              <div className="flex justify-between">
                <span style={{ color: '#a8b8cc' }}>Juros mensais ({(finances.loan.monthly_interest_rate * 100).toFixed(0)}%)</span>
                <span style={{ color: '#f5d020' }}>
                  {formatCurrency(finances.loan.monthly_interest_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: '#a8b8cc' }}>Limite disponível</span>
              <span style={{ color: '#a8b8cc' }}>
                {canTakeLoan ? formatCurrency(maxLoan) : 'limite atingido'}
              </span>
            </div>
          </div>

          {/* Slider de valor */}
          <div className="mb-3">
            <div className="flex justify-between mb-1" style={{ fontSize: 11, color: '#6b7c93' }}>
              <span>Valor</span>
              <span style={{ color: '#f5d020', fontWeight: 700 }}>{formatCurrency(loanAmount)}</span>
            </div>
            <input
              type="range"
              min={500_000} max={10_000_000} step={500_000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f5d020' }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!canTakeLoan || loanAmount > maxLoan}
              onClick={handleTakeLoan}
            >
              Pegar {formatCurrency(loanAmount)}
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!canRepay || loanAmount > finances.loan.principal}
              onClick={handleRepayLoan}
            >
              Pagar {formatCurrency(Math.min(loanAmount, finances.loan.principal))}
            </Button>
          </div>

          {finances.loan.principal > 0 && (
            <p style={{ fontSize: 10, color: '#6b7c93', marginTop: 8 }}>
              Juros aplicados a cada 4 rodadas (~1 mês). Taxa: {(finances.loan.monthly_interest_rate * 100).toFixed(0)}%/mês.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
