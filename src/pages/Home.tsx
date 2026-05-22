import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Pencil, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { NicknameInput } from '../components/NicknameInput';
import { Onboarding } from '../components/Onboarding';
import { Tutorial } from '../components/Tutorial';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick } from '../lib/sound';

export function Home() {
  const navigate = useNavigate();
  const { nickname, setNickname, hydrated, onboardingDone, tutorialCompleted, completeOnboarding, completeTutorial } = useSettingsStore();

  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);

  useEffect(() => {
    if (hydrated && onboardingDone && !tutorialCompleted && nickname) {
      setTimeout(() => setRunTutorial(true), 600);
    }
  }, [hydrated, onboardingDone, tutorialCompleted, nickname]);

  const handleSoloClick = () => {
    playClick();
    if (!nickname) { setNicknameModalOpen(true); return; }
    navigate('/single/new');
  };

  const handleMultiClick = () => {
    playClick();
    if (!nickname) { setNicknameModalOpen(true); return; }
    navigate('/multi');
  };

  const handleSaveNickname = async (n: string) => {
    setSaving(true);
    if (n.toLowerCase() === 'brasfoot') alert('Inspirado nos clássicos. ⚽ Bem-vindo de volta!');
    await setNickname(n);
    setSaving(false);
    setNicknameModalOpen(false);
    navigate('/single/new');
  };

  const handleChangeNickname = async (n: string) => {
    setSaving(true);
    await setNickname(n);
    setSaving(false);
    setNicknameModalOpen(false);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0a1e35' }}>
        <span className="font-retro text-2xl" style={{ color: '#f5d020', animation: 'pulse 1s infinite' }}>
          Carregando...
        </span>
      </div>
    );
  }

  if (!onboardingDone) return <Onboarding onDone={completeOnboarding} />;

  return (
    <>
      <Tutorial run={runTutorial} onDone={async () => { setRunTutorial(false); await completeTutorial(); }} />

      {/* Fundo: overlay azul-marinho sobre campo de futebol simulado */}
      <main
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
        style={{ backgroundColor: '#0a1e35' }}
      >
        {/* Grid decorativo imitando gramado */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(245,208,32,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245,208,32,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Círculo central do campo */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: 320, height: 320,
            borderRadius: '50%',
            border: '1px solid rgba(245,208,32,0.08)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="absolute top-4 right-4 rounded-lg p-2 transition-colors"
          style={{ color: '#6b7c93', border: '1px solid #1e3a5c', backgroundColor: '#0d1f36' }}
          aria-label="Configurações"
        >
          <SettingsIcon size={18} />
        </button>

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <div>
            <h1
              className="font-retro tracking-widest drop-shadow-lg"
              style={{ fontSize: 72, color: '#f5d020', lineHeight: 1 }}
            >
              TREINADOR BR
            </h1>
            <p style={{ color: '#a8b8cc', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>
              Gerenciador de Futebol Brasileiro
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3" style={{ width: 280 }}>
            <Button size="lg" fullWidth onClick={handleSoloClick} data-tour="solo-btn">
              <Trophy size={18} />
              Carreira Solo
            </Button>
            <Button size="lg" fullWidth variant="secondary" onClick={handleMultiClick} data-tour="multi-btn">
              <Users size={18} />
              Jogar com Amigos
            </Button>
          </div>

          {/* Nickname */}
          <div className="flex items-center gap-2" style={{ fontSize: 12, color: '#6b7c93' }} data-tour="nickname">
            {nickname ? (
              <>
                <span>Treinador:</span>
                <span style={{ color: '#a8b8cc', fontWeight: 600 }}>{nickname}</span>
                <button
                  onClick={() => setNicknameModalOpen(true)}
                  className="flex items-center gap-1 transition-colors"
                  style={{ color: '#f5d020', opacity: 0.7 }}
                >
                  <Pencil size={11} /> Trocar
                </button>
              </>
            ) : (
              <button
                onClick={() => setNicknameModalOpen(true)}
                style={{ color: '#f5d020', opacity: 0.7 }}
              >
                Definir apelido
              </button>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#1e3a5c', maxWidth: 260, lineHeight: 1.5 }}>
            Progresso salvo neste navegador. Limpar dados = perder tudo.
          </p>
        </div>

        <Modal
          open={nicknameModalOpen}
          onClose={nickname ? () => setNicknameModalOpen(false) : undefined}
          persistent={!nickname}
          title={nickname ? 'Trocar apelido' : 'Bem-vindo!'}
        >
          <p style={{ fontSize: 13, color: '#a8b8cc', marginBottom: 16 }}>
            {nickname ? 'Escolha um novo apelido.' : 'Antes de jogar, defina seu apelido de treinador.'}
          </p>
          <NicknameInput
            initial={nickname ?? ''}
            onSave={nickname ? handleChangeNickname : handleSaveNickname}
            loading={saving}
          />
        </Modal>
      </main>
    </>
  );
}
