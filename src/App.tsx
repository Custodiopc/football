import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useSettingsStore } from './stores/settingsStore';
import { useWorldStore } from './stores/worldStore';
import { useCareerStore } from './stores/careerStore';
import { CookieBanner } from './components/CookieBanner';

// Single-player
const Home            = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const NewSinglePlayer = lazy(() => import('./pages/NewSinglePlayer').then((m) => ({ default: m.NewSinglePlayer })));
const Career          = lazy(() => import('./pages/Career').then((m) => ({ default: m.Career })));
const Lineup          = lazy(() => import('./pages/Lineup').then((m) => ({ default: m.Lineup })));
const Result          = lazy(() => import('./pages/Result').then((m) => ({ default: m.Result })));
const SeasonEnd       = lazy(() => import('./pages/SeasonEnd').then((m) => ({ default: m.SeasonEnd })));

// Multiplayer
const MultiHub  = lazy(() => import('./pages/MultiHub').then((m) => ({ default: m.MultiHub })));
const MultiHost = lazy(() => import('./pages/MultiHost').then((m) => ({ default: m.MultiHost })));
const MultiJoin = lazy(() => import('./pages/MultiJoin').then((m) => ({ default: m.MultiJoin })));
const MultiGame = lazy(() => import('./pages/MultiGame').then((m) => ({ default: m.MultiGame })));

// Legais + Settings
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Terms    = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const Privacy  = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));

// Misc
const Lobby    = lazy(() => import('./pages/Lobby').then((m) => ({ default: m.Lobby })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

// Fase 12 — Jogo ao Vivo
const MatchLivePage = lazy(() => import('./pages/MatchLivePage').then((m) => ({ default: m.MatchLivePage })));

// Fase 11 — Mercado
const MarketPage   = lazy(() => import('./pages/MarketPage').then((m) => ({ default: m.MarketPage })));
const SearchPage   = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));

// Fase 10 — Academia de Juniores
const AcademyPage  = lazy(() => import('./pages/AcademyPage').then((m) => ({ default: m.AcademyPage })));

// Fase 9 — Estádio e Finanças
const StadiumPage  = lazy(() => import('./pages/StadiumPage').then((m) => ({ default: m.StadiumPage })));
const FinancesPage = lazy(() => import('./pages/FinancesPage').then((m) => ({ default: m.FinancesPage })));

// Fase 8 — Setup
const Setup    = lazy(() => import('./pages/Setup').then((m) => ({ default: m.Setup })));
const AddCoach = lazy(() => import('./pages/AddCoach').then((m) => ({ default: m.AddCoach })));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <span className="animate-pulse font-retro text-2xl text-gold">...</span>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Single-player */}
          <Route path="/"                         element={<Home />} />
          <Route path="/single/new"               element={<NewSinglePlayer />} />
          <Route path="/single/career"            element={<Career />} />
          <Route path="/single/career/lineup"     element={<Lineup />} />
          <Route path="/single/career/result"     element={<Result />} />
          <Route path="/single/career/season-end" element={<SeasonEnd />} />

          {/* Multiplayer */}
          <Route path="/multi"                    element={<MultiHub />} />
          <Route path="/multi/host"               element={<MultiHost />} />
          <Route path="/multi/join/:roomCode"     element={<MultiJoin />} />
          <Route path="/multi/game/:roomCode"     element={<MultiGame />} />

          {/* Fase 12 - Jogo ao Vivo */}
          <Route path="/career/match-live" element={<MatchLivePage />} />

          {/* Fase 11 - Mercado */}
          <Route path="/career/market"  element={<MarketPage />} />
          <Route path="/career/search"  element={<SearchPage />} />

          {/* Fase 10 - Academia */}
          <Route path="/career/academy"  element={<AcademyPage />} />

          {/* Fase 9 - Estádio e Finanças */}
          <Route path="/career/stadium"   element={<StadiumPage />} />
          <Route path="/career/finances"  element={<FinancesPage />} />

          {/* Fase 8 - Setup */}
          <Route path="/setup"            element={<Setup />} />
          <Route path="/setup/add-coach"  element={<AddCoach />} />

          {/* Settings + Legais */}
          <Route path="/settings"                 element={<Settings />} />
          <Route path="/terms"                    element={<Terms />} />
          <Route path="/privacy"                  element={<Privacy />} />

          {/* Misc */}
          <Route path="/lobby/:roomCode"          element={<Lobby />} />
          <Route path="*"                         element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateWorld    = useWorldStore((s) => s.hydrate);
  const hydrateCareer   = useCareerStore((s) => s.hydrate);

  useEffect(() => {
    Promise.all([hydrateSettings(), hydrateCareer(), hydrateWorld()]);
  }, [hydrateSettings, hydrateCareer, hydrateWorld]);

  return (
    <>
      <AnimatedRoutes />
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
