export const LEVELS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  'A2',
  'A3',
] as const

export type Level = (typeof LEVELS)[number]

export interface ActiveGame {
  id: string
  startedAt: number
  redLevel: Level
  blueLevel: Level
}

export interface GameRecord extends ActiveGame {
  endedAt: number
}

export interface PersistedState {
  version: 1
  activeGame: ActiveGame | null
  history: GameRecord[]
}

export const EMPTY_STATE: PersistedState = {
  version: 1,
  activeGame: null,
  history: [],
}

export function incrementLevel(level: Level): Level {
  const index = LEVELS.indexOf(level)
  return LEVELS[(index + 1) % LEVELS.length]
}

export function decrementLevel(level: Level): Level {
  const index = LEVELS.indexOf(level)
  return LEVELS[Math.max(0, index - 1)]
}

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && (LEVELS as readonly string[]).includes(value)
}

export function createGame(now = Date.now()): ActiveGame {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return {
    id: `${now}-${randomPart}`,
    startedAt: now,
    redLevel: '2',
    blueLevel: '2',
  }
}
