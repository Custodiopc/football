import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Trash2, Info } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { NicknameInput } from '../components/NicknameInput';
import { PageTransition } from '../components/PageTransition';
import { useSettingsStore } from '../stores/settingsStore';
import { clearAllData } from '../lib/storage';
import { ACHIEVEMENT_DEFS } from '../lib/feedback';
import { playClick } from '../lib/sound';

export function Settings() {
  const navigate = useNavigate();
  const { nickname, settings, updateSettings, setNickname, achievements } = useSettingsStore();

  const [clearModal, setClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [nickModal, setNickModal] = useState(false);
  const [savingNick, setSavingNick] = useState(false);

  const handleToggleSound = () => {
    playClick();
    updateSettings({ sound_enabled: !settings.sound_enabled });
  };

  const handleVolume = (v: number) => {
    updateSettings({ volume: v });
  };

  const handleClearData = async () => {
    setClearing(true);
    await clearAllData();
    window.location.href = '/'; // reload limpo
  };

  const handleSaveNick = async (n: string) => {
    setSavingNick(true);
    await setNickname(n);
    setSavingNick(false);
    setNickModal(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-ink px-4 py-6">
        <div className="mx-auto max-w-lg flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-cream/50 hover:text-cream hover:bg-white/5">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-retro text-3xl text-gold">Configurações</h1>
          </div>

          {/* Perfil */}
          <Card className="p-4">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-cream/40">Perfil</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cream/50">Apelido atual</p>
                <p className="font-retro text-xl text-cream">{nickname ?? '—'}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setNickModal(true)}>
                Alterar
              </Button>
            </div>
          </Card>

          {/* Som */}
          <Card className="p-4">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-cream/40">Som</h2>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-cream">
                {settings.sound_enabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-cream/40" />}
                <span className={settings.sound_enabled ? '' : 'text-cream/40'}>
                  {settings.sound_enabled ? 'Som ativado' : 'Som desativado'}
                </span>
              </div>
              <button
                onClick={handleToggleSound}
                className={[
                  'relative h-6 w-11 rounded-full transition-colors',
                  settings.sound_enabled ? 'bg-gold' : 'bg-white/20',
                ].join(' ')}
                role="switch"
                aria-checked={settings.sound_enabled}
              >
                <span className={[
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  settings.sound_enabled ? 'translate-x-5' : 'translate-x-0.5',
                ].join(' ')} />
              </button>
            </div>

            {settings.sound_enabled && (
              <div>
                <div className="mb-1 flex justify-between text-xs text-cream/40">
                  <span>Volume</span>
                  <span>{settings.volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.volume}
                  onChange={(e) => handleVolume(Number(e.target.value))}
                  className="w-full accent-gold"
                />
              </div>
            )}
          </Card>

          {/* Conquistas */}
          <Card className="p-4">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-cream/40">
              Conquistas ({achievements.length}/{Object.keys(ACHIEVEMENT_DEFS).length})
            </h2>
            <div className="flex flex-col gap-2">
              {(Object.entries(ACHIEVEMENT_DEFS) as [string, typeof ACHIEVEMENT_DEFS[keyof typeof ACHIEVEMENT_DEFS]][]).map(([id, def]) => {
                const unlocked = achievements.some((a) => a.id === id);
                return (
                  <div key={id} className={['flex items-center gap-3 rounded-xl px-3 py-2 transition-all',
                    unlocked ? 'bg-gold/8 border border-gold/20' : 'bg-white/4 border border-transparent opacity-50'].join(' ')}>
                    <span className="text-xl">{def.icon}</span>
                    <div className="flex-1">
                      <p className={['text-sm font-medium', unlocked ? 'text-cream' : 'text-cream/50'].join(' ')}>
                        {def.label}
                      </p>
                      <p className="text-xs text-cream/40">{def.description}</p>
                    </div>
                    {unlocked && <span className="text-xs text-gold">✓</span>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Dados */}
          <Card className="p-4 border-red-900/30">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-red-400/60">Dados</h2>
            <p className="mb-3 text-xs text-cream/40">
              Seu progresso é salvo neste navegador. Limpar dados apaga tudo permanentemente.
            </p>
            <Button fullWidth variant="danger" onClick={() => setClearModal(true)}>
              <Trash2 size={16} /> Limpar todos os dados
            </Button>
          </Card>

          {/* Sobre */}
          <Card className="p-4">
            <h2 className="mb-3 text-xs uppercase tracking-wider text-cream/40">
              <Info size={12} className="inline mr-1" />Sobre
            </h2>
            <div className="flex flex-col gap-1 text-xs text-cream/50">
              <p>BRASFOOT Web — v0.4.0</p>
              <p>Tempos reais do Brasileirão 2026. Jogadores fictícios.</p>
              <p>Sem afiliação com clubes, CBF, LFU ou LIBRA.</p>
              <p className="mt-2 italic text-cream/30">Inspirado nos clássicos. ⚽</p>
            </div>
          </Card>

        </div>

        {/* Modal alterar nickname */}
        <Modal open={nickModal} onClose={() => setNickModal(false)} title="Alterar apelido">
          <NicknameInput initial={nickname ?? ''} onSave={handleSaveNick} loading={savingNick} />
        </Modal>

        {/* Modal confirmar limpeza */}
        <Modal open={clearModal} onClose={() => setClearModal(false)} title="⚠️ Limpar dados?">
          <p className="mb-4 text-sm text-cream/70">
            Isso apagará <strong className="text-red-400">permanentemente</strong>: sua carreira atual, nickname, conquistas e histórico.
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button fullWidth variant="secondary" onClick={() => setClearModal(false)}>Cancelar</Button>
            <Button fullWidth variant="danger" loading={clearing} onClick={handleClearData}>
              Apagar tudo
            </Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
