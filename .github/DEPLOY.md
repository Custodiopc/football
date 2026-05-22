# Guia de Deploy — BRASFOOT Web

## Pré-requisitos

- Conta GitHub (gratuita)
- Conta Vercel (gratuita) — vercel.com
- Conta Supabase (gratuita) — supabase.com
- Conta Sentry (gratuita) — sentry.io (opcional)

---

## 1. Supabase (signaling multiplayer)

1. Acesse supabase.com → New Project
2. Escolha nome, senha e região (ex: South America - São Paulo)
3. Aguarde provisionamento (~2 min)
4. Vá em **Project Settings → API**
5. Copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
6. **Não é necessário criar tabelas.** O Realtime já está ativo por padrão.

---

## 2. Sentry (monitoramento de erros)

1. Acesse sentry.io → Create New Project → React
2. Copie o DSN exibido → `VITE_SENTRY_DSN`
3. Free tier: 5.000 erros/mês — suficiente para lançamento

---

## 3. GitHub

```bash
git init
git add .
git commit -m "feat: BRASFOOT Web v1.0 🏆"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/brasfoot-web.git
git push -u origin main
```

---

## 4. Vercel

1. Acesse vercel.com → Add New Project → Import Git Repository
2. Selecione o repo `brasfoot-web`
3. Framework Preset: **Vite** (detectado automaticamente)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **Environment Variables** — adicione:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `VITE_SENTRY_DSN` | DSN do Sentry (opcional) |

7. Clique **Deploy**
8. Após deploy, você receberá a URL: `brasfoot-web.vercel.app`

---

## 5. Domínio customizado (opcional)

1. No Vercel: Settings → Domains → Add
2. Configure DNS no seu registrador:
   - CNAME `www` → `cname.vercel-dns.com`
   - A `@` → IP do Vercel (exibido na interface)
3. Registradores brasileiros recomendados: Registro.br, Hostgator, Locaweb

---

## 6. Branch Protection (recomendado)

No GitHub: Settings → Branches → Add rule para `main`:
- ✅ Require pull request reviews
- ✅ Require status checks to pass (Vercel preview deploy)

---

## 7. Atualizar sitemap e OG image

Após definir seu domínio final, substitua `brasfoot.vercel.app` por ele em:
- `public/sitemap.xml`
- `public/robots.txt`
- `index.html` (meta og:url e og:image)

---

## 8. Checklist pós-deploy

- [ ] Acesse a URL pública e jogue uma rodada
- [ ] Teste PWA: no mobile, "Adicionar à tela inicial"
- [ ] Abra 2 abas/devices e teste multiplayer
- [ ] Compartilhe o link via WhatsApp — verifique preview OG
- [ ] Acesse /terms e /privacy
- [ ] No Sentry: crie um erro de teste (`throw new Error('teste')` no console)

---

## 9. Plano de lançamento

### Soft launch (semana 1)
1. Postar no **r/futebol** e **r/brasil**: título sugestivo, GIF de gameplay
2. Grupos de Brasfoot no **Facebook** (há comunidades ativas)
3. **Twitter/X**: vídeo de 30s mostrando 2 pessoas jogando juntas
4. Discord de comunidades de futebol e jogos brasileiros

### Métricas para validar (Vercel Analytics + Sentry)
- **30%+** visitantes completam 1 temporada → produto vale a pena
- **10%+** tentam o multiplayer → vale investir mais no multi
- Erros recorrentes no Sentry → prioridade de correção

---

## Custos estimados (free tier)

| Serviço | Limite free | Estimativa de aguentar |
|---------|-------------|------------------------|
| Vercel Hobby | 100GB bandwidth/mês | ~50k visitas |
| Supabase | 200 connections, 2M msgs Realtime/mês | ~500 salas/dia |
| PeerJS cloud | público, sem SLA | variável |
| Sentry | 5k erros/mês | suficiente no início |

---

## Roadmap pós-lançamento (por ordem de impacto)

1. Mais formações táticas (3-4-3, 5-3-2)
2. Mercado de transferências entre temporadas
3. Copa do Brasil em paralelo ao Brasileirão
4. Ligas privadas persistentes (Supabase DB)
5. Modo torneio rápido (8 jogadores, eliminatório)
