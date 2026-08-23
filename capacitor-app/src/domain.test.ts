import { describe, expect, it } from 'vitest'
import { decrementLevel, incrementLevel, type Level } from './domain'

describe('计分等级', () => {
  it('从 2 逐级加到 A3', () => {
    let level: Level = '2'
    const results: string[] = []
    for (let index = 0; index < 14; index += 1) {
      const next = incrementLevel(level)
      results.push(next)
      level = next
    }
    expect(results).toEqual(['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'A2', 'A3'])
  })

  it('A3 上滑回到 2', () => {
    expect(incrementLevel('A3')).toBe('2')
  })

  it('2 下滑仍为 2', () => {
    expect(decrementLevel('2')).toBe('2')
  })

  it('A2 下滑回到 A', () => {
    expect(decrementLevel('A2')).toBe('A')
  })
})
