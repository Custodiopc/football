# BALANCING.md — Motor de Simulação

## Alvos (Brasileirão real, média histórica)

| Métrica | Real | Motor atual |
|---------|------|-------------|
| Gols/jogo | ~2.5 | ~2.2–2.8 |
| Vitória mandante | ~45–50% | ~47% |
| Pontos do campeão | 75–85 | ~72–80 |
| Partidas sem gol | ~8–12% | ~10% |

## Constantes em `src/lib/simulation/constants.ts`

### v1.0 (Fase 2, lançamento)
```
GOALS_BASELINE = 1.35
HOME_BOOST     = 1.15
AWAY_PENALTY   = 0.95
YELLOW_RATE    = 0.08  (por jogador titular)
RED_RATE       = 0.01
INJURY_RATE    = 0.02
```

### v1.1 (Fase 4)
Ajustes após testes manuais de 5 temporadas:
- `GOALS_BASELINE` mantido em 1.35 (gols em linha com real)
- `HOME_BOOST` levemente reduzido de 1.20 → 1.15 (era muito desequilibrado)
- `INJURY_RATE` reduzido de 0.03 → 0.02 (havia lesões demais)

## Método de teste

1. Jogar 3+ temporadas no modo Normal, anotar:
   - Gols por rodada simulada (ver aba Calendário)
   - Posição final e pontos do campeão
   - Frequência de lesões no elenco
2. Comparar com alvos acima
3. Ajustar constantes em pequenos passos (±0.05)
4. Documentar aqui

## Próximos ajustes pendentes

- [ ] Verificar se times fortes vencem ~70% contra times fracos (teste de matchup extremo)
- [ ] Calibrar bônus de estilo `offensive` (parece fraco no atual)
- [ ] Avaliar se suspensão por 3 amarelos está gerando substituições suficientes

## Notas de design

O motor usa Poisson distribution para gols, que é a abordagem acadêmica padrão
para modelar futebol. A fórmula de força (ATK ponderado / DEF ponderado) é
inspirada no modelo Dixon-Coles simplificado.

A semente determinística (`hashStr(career.id + round)`) garante que a mesma
situação tática produza sempre o mesmo resultado — importante para debugging
e para o modo multiplayer (host simula, todos veem o mesmo).
