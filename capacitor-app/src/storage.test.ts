import { describe, expect, it } from 'vitest'
import { GameRepository, type StorageAdapter } from './storage'

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>()

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value)
  }
}

describe('本机记录', () => {
  it('保存并恢复未完成的一局', async () => {
    const storage = new MemoryStorage()
    const first = new GameRepository(storage)
    await first.load()
    const game = first.start(1_000)
    first.setScore('red', 'A3')
    await first.flush()

    const restored = new GameRepository(storage)
    const state = await restored.load()
    expect(state.activeGame).toMatchObject({ id: game.id, redLevel: 'A3', blueLevel: '2' })
  })

  it('完成后写入历史，并清除进行中的一局', async () => {
    const storage = new MemoryStorage()
    const repository = new GameRepository(storage)
    await repository.load()
    repository.start(10_000)
    repository.setScore('blue', 'K')
    const record = repository.complete(70_000)
    await repository.flush()

    expect(record).toMatchObject({ startedAt: 10_000, endedAt: 70_000, blueLevel: 'K' })
    expect(repository.snapshot().activeGame).toBeNull()
    expect(repository.snapshot().history).toHaveLength(1)
  })

  it('删除指定历史记录', async () => {
    const storage = new MemoryStorage()
    const repository = new GameRepository(storage)
    await repository.load()
    const game = repository.start(1_000)
    repository.complete(2_000)

    expect(repository.deleteRecord(game.id)).toBe(true)
    expect(repository.snapshot().history).toEqual([])
  })

  it('损坏的数据会安全回到空状态', async () => {
    const storage: StorageAdapter = {
      async get() {
        return '{not-json'
      },
      async set() {},
    }
    const repository = new GameRepository(storage)
    expect(await repository.load()).toEqual({ version: 1, activeGame: null, history: [] })
  })
})
