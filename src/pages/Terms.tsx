import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { PageTransition } from '../components/PageTransition';

export function Terms() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <SEOHead title="Termos de Uso" ogUrl="/terms" />
      <div className="min-h-screen bg-ink px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>

          <h1 className="font-retro text-4xl text-gold mb-2">Termos de Uso</h1>
          <p className="text-sm text-cream/40 mb-8">Última atualização: maio de 2025</p>

          <div className="prose prose-invert max-w-none flex flex-col gap-6 text-cream/75 leading-relaxed">

            <section>
              <h2 className="font-retro text-2xl text-gold/80 mb-2">1. Sobre o jogo</h2>
              <p>BRASFOOT Web é um jogo de simulação de gerenciamento de futebol disponibilizado gratuitamente. É um projeto independente, sem fins lucrativos, criado para entretenimento.</p>
              <p className="mt-2 text-sm text-cream/50 bg-white/4 rounded-xl p-3">
                <strong className="text-cream/70">Aviso:</strong> Os nomes e escudos dos clubes reais do Brasileirão são utilizados apenas para fins de referência em contexto de entretenimento. Os jogadores exibidos são inteiramente fictícios. BRASFOOT Web não tem qualquer afiliação, endosso ou vínculo oficial com os clubes, com a CBF, LFU, LIBRA ou qualquer entidade do futebol brasileiro.
              </p>
            </section>

            <section>
              <h2 className="font-retro text-2xl text-gold/80 mb-2">2. Uso permitido</h2>
              <p>Você pode usar o jogo livremente para entretenimento pessoal. Não é permitido:</p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Redistribuir o código sem créditos ao projeto original</li>
                <li>Usar o projeto para fins comerciais sem autorização</li>
                <li>Tentar explorar vulnerabilidades do sistema de salas multiplayer</li>
                <li>Usar o chat para disseminar conteúdo ofensivo, discriminatório ou ilegal</li>
              </ul>
            </section>

            <section>
              <h2 className="font-retro text-2xl text-gold/80 mb-2">3. Dados e privacidade</h2>
              <p>Seu nickname e progresso de jogo são salvos <strong className="text-cream">exclusivamente no seu navegador</strong> (IndexedDB). Não há cadastro, login ou sincronização de dados pessoais em servidores.</p>
              <p className="mt-2">Para detalhes completos, consulte nossa <a href="/privacy" className="text-gold/70 underline underline-offset-2 hover:text-gold">Política de Privacidade</a>.</p>
            </section>

            <section>
              <h2 className="font-retro text-2xl text-gold/80 mb-2">4. Salas multiplayer</h2>
              <p>As salas multiplayer são efêmeras: existem apenas enquanto o anfitrião mantém o navegador aberto. Não armazenamos o histórico de partidas ou mensagens de chat em servidores. A comunicação é feita diretamente entre os navegadores dos jogadores (P2P via WebRTC).</p>
            </section>

            <section>
              <h2 className="font-retro text-2xl text-gold/80 mb-2">5. Disponibilidade</h2>
              <p>O jogo é fornecido "como está", sem garantias de disponibilidade contínua. Podemos modificar, suspender ou encerrar o serviço a qualquer momento, sem aviso prévio.</p>
            </section>

            <section>
              <h2 className="font-retro text-2xl text-gold/80 mb-2">6. Contato</h2>
              <p>Dúvidas ou sugestões? Abra uma issue no repositório do projeto no GitHub.</p>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
