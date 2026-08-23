import { Preferences } from '@capacitor/preferences'
import {
  EMPTY_STATE,
  createGame,
  isLevel,
  type ActiveGame,
  type GameRecord,
  type Level,
  type PersistedState,
} from './domain'

const STORAGE_KEY = 'gdscore.state.v1'

export interface StorageAdapter {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
}

export const preferencesStorage: StorageAdapter = {
  async get(key) {
    const result = await Preferences.get({ key })
    return result.value
  },
  async set(key, value) {
    await Preferences.set({ key, value })
  },
}

function isActiveGame(value: unknown): value is ActiveGame {
  if (!value || typeof value !== 'object') return false
  const game = value as Record<string, unknown>
  return (
    typeof game.id === 'string' &&
    Number.isFinite(game.startedAt) &&
    isLevel(game.redLevel) &&
    isLevel(game.blueLevel)
  )
}

function isGameRecord(value: unknown): value is GameRecord {
  if (!isActiveGame(value)) return false
  return Number.isFinite((value as unknown as Record<string, unknown>).endedAt)
}

function parseState(raw: string | null): PersistedState {
  if (!raw) return structuredClone(EMPTY_STATE)

  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return structuredClone(EMPTY_STATE)
    const state = value as Record<string, unknown>
    if (state.version !== 1 || !Array.isArray(state.history)) {
      return structuredClone(EMPTY_STATE)
    }

    return {
      version: 1,
      activeGame: isActiveGame(state.activeGame) ? state.activeGame : null,
      history: state.history.filter(isGameRecord).sort((a, b) => b.endedAt - a.endedAt),
    }
  } catch {
    return structuredClone(EMPTY_STATE)
  }
}

export class GameRepository {
  private state: PersistedState = structuredClone(EMPTY_STATE)
  private writeQueue: Promise<void> = Promise.resolve()
  private readonly storage: StorageAdapter

  constructor(storage: StorageAdapter) {
    this.storage = storage
  }

  async load(): Promise<PersistedState> {
    this.state = parseState(await this.storage.get(STORAGE_KEY))
    return this.snapshot()
  }

  snapshot(): PersistedState {
    return structuredClone(this.state)
  }

  start(now = Date.now()): ActiveGame {
    if (!this.state.activeGame) {
      this.state.activeGame = createGame(now)
      this.persist()
    }
    return structuredClone(this.state.activeGame)
  }

  setScore(team: 'red' | 'blue', level: Level): void {
    const game = this.state.activeGame
    if (!game) return
    if (team === 'red') game.redLevel = level
    else game.blueLevel = level
    this.persist()
  }

  complete(now = Date.now()): GameRecord | null {
    const game = this.state.activeGame
    if (!game) return null

    const record: GameRecord = { ...game, endedAt: Math.max(now, game.startedAt) }
    this.state.activeGame = null
    this.state.history.unshift(record)
    this.persist()
    return structuredClone(record)
  }

  deleteRecord(id: string): boolean {
    const originalLength = this.state.history.length
    this.state.history = this.state.history.filter((record) => record.id !== id)
    if (this.state.history.length === originalLength) return false
    this.persist()
    return true
  }

  async flush(): Promise<void> {
    await this.writeQueue
  }

  private persist(): void {
    const value = JSON.stringify(this.state)
    this.writeQueue = this.writeQueue.then(() => this.storage.set(STORAGE_KEY, value))
  }
}
