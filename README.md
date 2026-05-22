# BRASFOOT Web

Gerenciador de futebol brasileiro inspirado no Brasfoot clássico. Offline-first, sem login.

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build produção
```

## Estrutura

```
src/
  components/   Button, Card, Modal, NicknameInput, TeamCard, TopBar
  pages/        Home, NewSinglePlayer, Career, Lobby, NotFound
  data/         seed.json + helpers tipados
  lib/          storage.ts (idb-keyval), utils.ts
  stores/       settingsStore, careerStore (Zustand)
  types/        tipos TypeScript do domínio
  styles/       globals.css
```

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Tela inicial |
| `/single/new` | Escolher time e dificuldade |
| `/single/career` | Carreira (placeholder Fase 1) |
| `/lobby/:roomCode` | Sala P2P (Fase 3) |

## Fases

- [x] Fase 1 — Fundação
- [ ] Fase 2 — Single-player completo
- [ ] Fase 3 — Multiplayer P2P
- [ ] Fase 4 — Polish
- [ ] Fase 5 — Deploy (Vercel)
