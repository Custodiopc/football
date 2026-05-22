import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Database, Wifi, Cookie } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { PageTransition } from '../components/PageTransition';

function PrivacyCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-ink-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-gold/70">{icon}</div>
        <h2 className="font-retro text-xl text-gold/90">{title}</h2>
      </div>
      <div className="text-sm text-cream/70 leading-relaxed flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function Privacy() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <SEOHead title="Política de Privacidade" ogUrl="/privacy" />
      <div className="min-h-screen bg-ink px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>

          <h1 className="font-retro text-4xl text-gold mb-2">Política de Privacidade</h1>
          <p className="text-sm text-cream/40 mb-8">Última atualização: maio de 2025</p>

          {/* Resumo */}
          <div className="mb-6 rounded-2xl border border-green-700/40 bg-green-950/20 p-5">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-400 mb-1">Resumo direto ao ponto</p>
                <p className="text-sm text-cream/70">
                  Não coletamos dados pessoais. Não há cadastro, login, analytics ou anúncios.
                  Seu nickname e progresso ficam <strong className="text-cream">só no seu navegador</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <PrivacyCard icon={<Database size={20} />} title="Dados armazenados localmente">
              <p>O BRASFOOT Web armazena as seguintes informações <strong className="text-cream">apenas no seu dispositivo</strong>, via IndexedDB do navegador:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong className="text-cream/90">Nickname:</strong> o apelido que você escolheu</li>
                <li><strong className="text-cream/90">Progresso de carreira:</strong> times, escalações, tabela, resultados</li>
                <li><strong className="text-cream/90">Conquistas:</strong> achievements desbloqueados</li>
                <li><strong className="text-cream/90">Configurações:</strong> som, volume</li>
              </ul>
              <p className="mt-2 text-cream/50 text-xs bg-white/4 rounded-xl p-2">
                ⚠️ Limpar dados do site no navegador apaga tudo permanentemente. Não há backup.
              </p>
            </PrivacyCard>

            <PrivacyCard icon={<Wifi size={20} />} title="Modo multiplayer (P2P)">
              <p>Quando você joga no modo multiplayer:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li><strong className="text-cream/90">Supabase Realtime</strong> é usado apenas como servidor de sinalização para estabelecer a conexão P2P. Não armazenamos o histórico de partidas.</li>
                <li><strong className="text-cream/90">PeerJS / WebRTC</strong> estabelece comunicação direta entre os navegadores dos jogadores. O servidor público do PeerJS é usado como relay STUN.</li>
                <li><strong className="text-cream/90">Mensagens de chat</strong> trafegam diretamente entre os jogadores e não são armazenadas em nenhum servidor.</li>
                <li>Ao sair da sala, todos os dados da partida são descartados.</li>
              </ul>
            </PrivacyCard>

            <PrivacyCard icon={<Cookie size={20} />} title="Cookies e rastreamento">
              <p>O BRASFOOT Web <strong className="text-cream">não usa cookies</strong> de rastreamento, pixels de marketing ou scripts de analytics de terceiros.</p>
              <p>Usamos <strong className="text-cream/90">localStorage</strong> apenas para:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Registrar que você aceitou este aviso de cookies</li>
                <li>Armazenar preferências de som (duplicadas do IndexedDB por conveniência)</li>
              </ul>
              <p className="mt-2">Integramos o <strong className="text-cream/90">Sentry</strong> para capturar erros JavaScript. O Sentry pode coletar o stack trace do erro e metadados técnicos (URL, tipo de navegador). Dados pessoais do usuário são explicitamente removidos antes do envio.</p>
            </PrivacyCard>

            <div className="rounded-2xl border border-white/8 bg-ink-card p-5">
              <h2 className="font-retro text-xl text-gold/90 mb-3">Seus direitos (LGPD)</h2>
              <p className="text-sm text-cream/70 mb-3">Sob a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ['Acesso', 'Todos os dados estão no seu navegador. Você pode inspecioná-los via DevTools.'],
                  ['Exclusão', 'Use "Limpar todos os dados" em Configurações para apagar tudo.'],
                  ['Portabilidade', 'Os dados são formato JSON no IndexedDB. Exportável via DevTools.'],
                  ['Informação', 'Esta política descreve todos os dados tratados.'],
                ].map(([right, desc]) => (
                  <div key={right} className="rounded-xl bg-white/4 p-3">
                    <p className="text-xs font-semibold text-cream/80 mb-1">{right}</p>
                    <p className="text-xs text-cream/50">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-xs text-cream/30 py-4">
              <p>Dúvidas? Abra uma issue no repositório do projeto.</p>
              <p className="mt-1">BRASFOOT Web não tem afiliação com CBF, LFU, LIBRA ou clubes brasileiros.</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
