import type { LiveEventType } from './matchStats';

// ── Templates de narração ─────────────────────────────────────

const GOAL_OPEN_PLAY = [
  'GOOOOL DE {scorer}! Que finalização!',
  '{scorer} balança as redes! {team} comemora!',
  'É GOL! {scorer} aproveita e converte!',
  '{scorer} manda pra rede! Que lance bonito!',
  'GOOOOL! {scorer} estufa as redes!',
  'Que gol de {scorer}! A torcida vai à loucura!',
  '{scorer} recebe na área e não desperdiça!',
  'Perfeito! {scorer} marca mais um gol!',
  'GOLAÇO DE {scorer}! Que finalização!',
  '{scorer} domina e chuta cruzado! É GOL!',
];

const GOAL_HEADER = [
  '{scorer} sobe MAIS QUE TODOS e manda de cabeça!',
  'Cabeçada certeira de {scorer}! GOOOL!',
  '{scorer} aproveita o cruzamento e cabeceia! Que potência!',
  'GOL! {scorer} sobe e cabeceia no cantinho!',
  '{scorer} martela de cabeça! Fantástico!',
];

const GOAL_FREEKICK = [
  '{scorer} cobra a falta e vai direto! GOOOL!',
  'Falta excelente de {scorer}! Colocado no ângulo!',
  'GOLAÇO! {scorer} cobra a falta sem deixar o goleiro reagir!',
  '{scorer} pega a bola e... ESTUFA AS REDES!',
  'Que gol olímpico de {scorer}! Pancada de falta!',
];

const GOAL_PENALTY = [
  '{scorer} bate firme no canto! Goleiro não alcança!',
  'Pênalti convertido por {scorer}! Sem chances pro goleiro!',
  '{scorer} desloca o goleiro e converte!',
  'Cobrança perfeita de {scorer}! É gol de pênalti!',
  '{scorer} para e bate! Gol!',
];

const BIG_SAVE = [
  '{keeper} faz uma defesa INCRÍVEL! Salvou o time!',
  'Que defesa de {keeper}! A torcida explode!',
  '{keeper} espalmou na trave! Milagre!',
  'DEFESAÇO de {keeper}! Impossível passar por ele!',
  '{keeper} voou no canto e salvou!',
  'Ufa! {keeper} evitou o gol em cima da linha!',
];

const SHOT_MISSED = [
  '{shooter} chutou por cima do gol. Que desperdício!',
  'A bola passou raspando a trave! Quase gol de {shooter}!',
  '{shooter} chutou para fora. Oportunidade perdida.',
  'Que chance perdida! {shooter} não aproveitou.',
  'O goleiro saiu bem e bloqueou o chute de {shooter}.',
  '{shooter} cabeceou para fora! Que pena!',
];

const YELLOW_CARD = [
  '{player} recebe cartão amarelo por falta dura.',
  'Amarelo para {player}. Precisa ter cuidado!',
  '{player} vai para o livro de notas. Advertido.',
  'O árbitro mostrou amarelo para {player}.',
  'Falta desnecessária de {player}. Cartão amarelo.',
];

const RED_CARD = [
  'VERMELHO! {player} está EXPULSO! Time jogará com 10!',
  '{player} recebeu o segundo amarelo! Está fora do jogo!',
  'Que confusão! {player} vai para o vestiário mais cedo!',
  'Expulsão polêmica de {player}! Árbitro não perdoou!',
];

const INJURY = [
  '{player} cai no gramado. Parece lesionado.',
  '{player} sinaliza para o banco. Deverá sair.',
  'Jogada dura atingiu {player}. Preocupante.',
  '{player} não consegue continuar. Substituição necessária.',
];

const HALF_TIME = [
  'Apita o árbitro para o intervalo!',
  'Fim do primeiro tempo. Vamos para o descanso.',
  'Intervalo! Os jogadores vão para o vestiário.',
  '45 minutos de muita emoção! Intervalo agora.',
];

const FULL_TIME = [
  'FIM DE JOGO!',
  'Apita o árbitro! Acabou!',
  'Encerrada a partida!',
  'E com isso termina a partida!',
];

const KICKOFF = [
  'A bola começa a rolar!',
  'Iniciado o jogo!',
  'Começa o segundo tempo!',
  'E a partida está aberta!',
];

// ── Contextual ────────────────────────────────────────────────

const LATE_WINNER = [
  'GOOOOL NOS ACRÉSCIMOS! Que final de jogo incrível!',
  'O TEMPO ESTAVA ACABANDO! Gol nos acréscimos!',
  'VIRADA ÉPICA! Gol nos minutos finais!',
  'Impossível! Gol no último minuto!',
];

const COMEBACK = [
  'VIRADA ESPETACULAR! Que jogo histórico!',
  'A VIRADA ACONTECEU! Jogo incrível!',
  'Quem disse que estava perdido? VIROU!',
  'Reviravolta inacreditável! O jogo virou!',
];

const BLOWOUT = [
  'Está virando passeio! Resultado humilhante!',
  'Massacre! Goleada histórica!',
  'Que vexame! O placar não para de crescer.',
  'Não tem mais jeito! Goleada impressionante!',
];

const HAT_TRICK = [
  'HAT-TRICK DE {scorer}! Que atuação magistral!',
  'TERCEIRO GOL DE {scorer}! Hat-trick confirmado!',
  '{scorer} faz 3 no mesmo jogo! Prodígio!',
];

const FOURTH_GOAL = [
  'INACREDITÁVEL! {scorer} marca QUATRO gols!',
  'PÓQUER de {scorer}! Jogo histórico!',
];

// ── Picker ────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Substituir placeholders ───────────────────────────────────

function fill(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

// ── Gerar narrativa ───────────────────────────────────────────

export interface NarrativeContext {
  scorerName?: string;
  keeperName?: string;
  shooterName?: string;
  playerName?: string;
  teamShort?: string;
  goalType?: 'open_play' | 'header' | 'freekick' | 'penalty';
  // Contexto do jogo
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  isUserGoal?: boolean;
  scorerGoalsToday?: number; // para hat-trick
  wasLosing?: boolean;        // para comeback
}

export function generateNarrative(
  type: LiveEventType,
  ctx: NarrativeContext = {},
): string {
  const vars: Record<string, string> = {
    scorer:  ctx.scorerName  ?? 'Jogador',
    keeper:  ctx.keeperName  ?? 'Goleiro',
    shooter: ctx.shooterName ?? 'Jogador',
    player:  ctx.playerName  ?? 'Jogador',
    team:    ctx.teamShort   ?? 'Time',
  };

  // Contextuais especiais
  if (type === 'goal') {
    const min    = ctx.minute ?? 0;
    const diff   = Math.abs((ctx.homeScore ?? 0) - (ctx.awayScore ?? 0));
    const goals  = ctx.scorerGoalsToday ?? 1;

    if (goals >= 4)      return fill(pick(FOURTH_GOAL), vars);
    if (goals >= 3)      return fill(pick(HAT_TRICK), vars);
    if (min >= 85 && ctx.wasLosing)  return fill(pick(LATE_WINNER), vars);
    if (ctx.wasLosing)   return fill(pick(COMEBACK), vars);
    if (diff >= 4)       return fill(pick(BLOWOUT), vars);

    // Por tipo de gol
    switch (ctx.goalType) {
      case 'header':   return fill(pick(GOAL_HEADER),    vars);
      case 'freekick': return fill(pick(GOAL_FREEKICK),  vars);
      case 'penalty':  return fill(pick(GOAL_PENALTY),   vars);
      default:         return fill(pick(GOAL_OPEN_PLAY), vars);
    }
  }

  switch (type) {
    case 'big_save':   return fill(pick(BIG_SAVE),    vars);
    case 'shot_missed':return fill(pick(SHOT_MISSED), vars);
    case 'yellow':     return fill(pick(YELLOW_CARD), vars);
    case 'red':        return fill(pick(RED_CARD),    vars);
    case 'injury':     return fill(pick(INJURY),      vars);
    case 'half_time':  return pick(HALF_TIME);
    case 'full_time':  return pick(FULL_TIME);
    case 'kickoff':    return pick(KICKOFF);
    default:           return '';
  }
}

// ── Ícone por tipo de evento ──────────────────────────────────

export function eventIcon(type: LiveEventType, isUserTeam: boolean): string {
  switch (type) {
    case 'goal':       return isUserTeam ? '⚽🟢' : '⚽🔴';
    case 'big_save':   return '🧤';
    case 'shot_missed':return '💨';
    case 'yellow':     return '🟨';
    case 'red':        return '🟥';
    case 'injury':     return '🤕';
    case 'half_time':  return '🔔';
    case 'full_time':  return '🏁';
    case 'kickoff':    return '🏟️';
    default:           return '•';
  }
}
