import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { JuniorPlayer } from '../types/academy';
import { ALL_ATTRS_BY_POS, ATTR_LABEL, POSITION_LABEL, SIDE_LABEL } from '../types';
import { formatCpe, formatRevealedHighlights } from '../lib/academy';
import { formatCurrency } from '../lib/finance';
import { attrColor } from '../lib/simulation/playerAttributes';

interface JuniorDetailModalProps {
  junior: JuniorPlayer | null;
  onClose: () => void;
  onPromote: (id: number) => Promise<{ error?: string }>;
  onDismiss: (id: number) => Promise<void>;
  onSetNickname: (id: number, nickname: string) => Promise<void>;
}

export function JuniorDetailModal({
  junior, onClose, onPromote, onDismiss, onSetNickname,
}: JuniorDetailModalProps) {
  const [nicknameEdit, setNicknameEdit] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!junior) return null;

  const attrsToShow = ALL_ATTRS_BY_POS[junior.position];
  const highlights = formatRevealedHighlights(junior);

  const handlePromote = async () => {
    setLoading('promote');
    setError('');
    const result = await onPromote(junior.id);
    setLoading(null);
    if (result.error) { setError(result.error); return; }
    onClose();
  };

  const handleDismiss = async () => {
    if (!confirm(`Dispensar ${junior.full_name}?`)) return;
    setLoading('dismiss');
    await onDismiss(junior.id);
    setLoading(null);
    onClose();
  };

  const handleSaveNickname = async () => {
    await onSetNickname(junior.id, nicknameValue.trim());
    setNicknameEdit(false);
  };

  return (
    <Modal open={!!junior} onClose={onClose}>
      {/* Cabeçalho */}
      <div className="pb-3 mb-3" style={{ borderBottom: '1px solid #1e3a5c' }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f5f0' }}>
              {junior.nickname ?? junior.full_name}
            </div>
            {junior.nickname && (
              <div style={{ fontSize: 11, color: '#6b7c93' }}>{junior.full_name}</div>
            )}
            <div style={{ fontSize: 12, color: '#a8b8cc', marginTop: 2 }}>
              {POSITION_LABEL[junior.position]} · {SIDE_LABEL[junior.side]} · {junior.age} anos · {junior.country}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-retro" style={{ fontSize: 22, color: '#f5d020', lineHeight: 1 }}>
              F:{junior.current_force}
            </div>
            <div style={{ fontSize: 12, color: '#f5d020' }}>
              {formatCpe(junior.cpe_stars)}
            </div>
          </div>
        </div>

        {/* Barra de desenvolvimento */}
        <div className="mt-3">
          <div className="flex justify-between mb-1" style={{ fontSize: 11, color: '#6b7c93' }}>
            <span>Desenvolvimento</span>
            <span style={{ color: '#f5d020', fontWeight: 700 }}>
              {Math.round(junior.development_percent)}%
            </span>
          </div>
          <div style={{ height: 8, backgroundColor: '#0d1f36', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, transition: 'width 0.3s',
              width: `${junior.development_percent}%`,
              background: 'linear-gradient(90deg, #3b9adb, #4ade80)',
            }} />
          </div>
        </div>

        {/* Características reveladas */}
        {highlights !== '—' && (
          <div className="mt-2" style={{ fontSize: 11, color: '#f5d020' }}>
            ⭐ Características: {highlights}
          </div>
        )}
      </div>

      {/* Atributos atuais */}
      <div className="mb-3">
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7c93', marginBottom: 6 }}>
          Atributos atuais (Força estimada: {junior.current_force})
        </p>
        {attrsToShow.map((key) => {
          const val = (junior.current_attributes[key] as number | undefined) ?? 0;
          if (val === 0) return null;
          const isRev = junior.revealed_highlight_1 === key || junior.revealed_highlight_2 === key;
          const color = attrColor(val);
          const pct = (val / 20) * 100;
          return (
            <div key={key} className="flex items-center gap-2 mb-1">
              <span style={{ width: 88, fontSize: 10, color: isRev ? '#f5d020' : '#a8b8cc', textAlign: 'right' }}>
                {ATTR_LABEL[key] ?? key}
                {isRev && ' ⭐'}
              </span>
              <div style={{ flex: 1, height: 8, backgroundColor: '#0d1f36', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4 }} />
              </div>
              <span style={{ width: 22, fontSize: 11, fontWeight: 700, color, textAlign: 'right' }}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Finanças */}
      <div
        className="grid grid-cols-2 gap-2 rounded px-3 py-2 mb-3"
        style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', fontSize: 12 }}
      >
        <div>
          <span style={{ color: '#6b7c93' }}>Valor estimado</span><br />
          <span style={{ color: '#f5d020', fontWeight: 600 }}>{formatCurrency(junior.estimated_value)}</span>
        </div>
        <div>
          <span style={{ color: '#6b7c93' }}>Salário/semana</span><br />
          <span style={{ color: '#f5f5f0', fontWeight: 600 }}>{formatCurrency(junior.weekly_wage)}</span>
        </div>
      </div>

      {/* Definir apelido */}
      {nicknameEdit ? (
        <div className="flex gap-2 mb-3">
          <input
            value={nicknameValue}
            onChange={(e) => setNicknameValue(e.target.value)}
            placeholder="Apelido (2-20 chars)"
            maxLength={20}
            style={{
              flex: 1, backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
              color: '#f5f5f0', fontSize: 12, padding: '6px 10px', borderRadius: 6,
            }}
          />
          <Button size="sm" onClick={handleSaveNickname}>Salvar</Button>
          <Button size="sm" variant="secondary" onClick={() => setNicknameEdit(false)}>✕</Button>
        </div>
      ) : (
        <button
          onClick={() => { setNicknameValue(junior.nickname ?? ''); setNicknameEdit(true); }}
          style={{ fontSize: 11, color: '#f5d020', cursor: 'pointer', border: 'none', background: 'none', marginBottom: 12 }}
        >
          {junior.nickname ? 'Editar apelido' : '+ Definir apelido'}
        </button>
      )}

      {error && <p style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{error}</p>}

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          fullWidth
          onClick={handlePromote}
          loading={loading === 'promote'}
        >
          Promover ao elenco »
        </Button>
        <Button
          fullWidth
          variant="danger"
          onClick={handleDismiss}
          loading={loading === 'dismiss'}
        >
          Dispensar
        </Button>
      </div>
    </Modal>
  );
}
