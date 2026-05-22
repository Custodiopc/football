import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './styles/globals.css';
import App from './App';

// ── Sentry ────────────────────────────────────────────────────
// Configure VITE_SENTRY_DSN no .env após criar projeto em sentry.io (free)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    // Não enviar dados em dev
    enabled: import.meta.env.PROD,
    // Amostrar 20% das sessões (economiza cota free)
    tracesSampleRate: 0.2,
    // Não capturar erros de extensões de browser
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
    ],
    beforeSend(event) {
      // Não enviar dados de localStorage/IndexedDB (privacidade)
      if (event.request?.data) delete event.request.data;
      return event;
    },
  });
}

// ── App ───────────────────────────────────────────────────────
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element não encontrado');

createRoot(rootEl).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-ink gap-4 px-4 text-center">
          <span className="text-4xl">⚠️</span>
          <h1 className="font-retro text-2xl text-gold">Algo deu errado</h1>
          <p className="text-sm text-cream/60">O erro foi reportado automaticamente.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-xl bg-gold px-5 py-2.5 font-body text-sm font-semibold text-ink hover:bg-gold-light transition-colors"
          >
            Recarregar
          </button>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
