import { describe, it, expect } from 'vitest'
import { parseCommand } from '../src/lib/parser/parse'
import corpus from './commands.json'

interface TestCase {
  id: string
  input: string
  expectKinds: string[]
  expectValues?: Record<string, unknown>
  note?: string
}

describe('parseCommand — corpus', () => {
  let passed = 0
  let total = 0

  // Run each test case from commands.json
  for (const tc of corpus as TestCase[]) {
    it(`[${tc.id}] ${tc.input || '<empty>'}${tc.note ? ` (${tc.note})` : ''}`, () => {
      total++

      // MUST NOT throw
      let result: ReturnType<typeof parseCommand>
      expect(() => {
        result = parseCommand(tc.input)
      }).not.toThrow()

      result = parseCommand(tc.input)

      // Check expected kinds (order-insensitive)
      const returnedKinds = result.intents.map(i => i.kind)
      for (const expectedKind of tc.expectKinds) {
        expect(returnedKinds).toContain(expectedKind)
      }

      // Check no extra unexpected singleton kinds
      // (only assert specific expected values when provided)
      if (tc.expectValues) {
        for (const [field, expected] of Object.entries(tc.expectValues)) {
          const matchingIntent = result.intents.find(i => {
            const v = (i as Record<string, unknown>)[field]
            return v === expected
          })
          expect(
            matchingIntent,
            `Expected intent with ${field}=${JSON.stringify(expected)} in ${JSON.stringify(returnedKinds)}`
          ).toBeTruthy()
        }
      }

      passed++
    })
  }

  // Summary assertion that always runs
  it('reports pass rate', () => {
    const cases = corpus as TestCase[]
    let p = 0
    for (const tc of cases) {
      try {
        const result = parseCommand(tc.input)
        const returnedKinds = result.intents.map(i => i.kind)
        let ok = true
        for (const expectedKind of tc.expectKinds) {
          if (!returnedKinds.includes(expectedKind)) { ok = false; break }
        }
        if (tc.expectValues) {
          for (const [field, expected] of Object.entries(tc.expectValues)) {
            const matchingIntent = result.intents.find(i => (i as Record<string, unknown>)[field] === expected)
            if (!matchingIntent) { ok = false; break }
          }
        }
        if (ok) p++
      } catch {
        // crash counts as fail
      }
    }
    const pct = Math.round((p / cases.length) * 100)
    console.log(`\n✅ Parser corpus: Passed ${p} / ${cases.length} commands (${pct}%)`)
    // Require at least 85% pass rate
    expect(pct).toBeGreaterThanOrEqual(85)
  })
})

describe('parseCommand — never throws', () => {
  const chaosInputs = [
    null as unknown as string,
    undefined as unknown as string,
    '',
    '   ',
    '!@#$%^&*()',
    'a'.repeat(10000),
    '\u0000\u0001\u0002',
    '200 x',
    'kb kb kb',
    'jpg png jpg png',
  ]

  for (const input of chaosInputs) {
    it(`does not throw on: ${JSON.stringify(String(input)).slice(0, 40)}`, () => {
      expect(() => parseCommand(input)).not.toThrow()
    })
  }
})

describe('parseCommand — conflict resolution', () => {
  it('later max_kb wins and adds warning', () => {
    const result = parseCommand('under 100 kb, under 50 kb')
    const maxKbIntents = result.intents.filter(i => i.kind === 'max_kb')
    expect(maxKbIntents).toHaveLength(1)
    expect((maxKbIntents[0] as { kind: string; kb: number }).kb).toBe(50)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('later resize wins', () => {
    const result = parseCommand('100 x 100 px, resize to 200x230')
    const resizes = result.intents.filter(i => i.kind === 'resize_px')
    expect(resizes).toHaveLength(1)
    expect((resizes[0] as { kind: string; width: number }).width).toBe(200)
  })

  it('later format wins', () => {
    const result = parseCommand('jpg, then png')
    const formats = result.intents.filter(i => i.kind === 'format')
    expect(formats).toHaveLength(1)
    expect((formats[0] as { kind: string; format: string }).format).toBe('png')
  })
})

describe('parseCommand — multi-clause', () => {
  it('parses comma-separated clauses', () => {
    const result = parseCommand('200 x 230 px, 50 kb se kam, jpg')
    const kinds = result.intents.map(i => i.kind)
    expect(kinds).toContain('resize_px')
    expect(kinds).toContain('max_kb')
    expect(kinds).toContain('format')
  })

  it('parses "aur" separated clauses', () => {
    const result = parseCommand('rotate 90 aur background safed karo')
    const kinds = result.intents.map(i => i.kind)
    expect(kinds).toContain('rotate')
    expect(kinds).toContain('white_bg')
  })

  it('parses "and" separated clauses', () => {
    const result = parseCommand('grayscale and brighter')
    const kinds = result.intents.map(i => i.kind)
    expect(kinds).toContain('grayscale')
    expect(kinds).toContain('brightness')
  })
})

describe('parseCommand — Hinglish number words', () => {
  it('pachaas → 50 kb', () => {
    const result = parseCommand('pachaas kb se kam')
    expect(result.intents.some(i => i.kind === 'max_kb' && (i as {kb:number}).kb === 50)).toBe(true)
  })

  it('bees se pachaas kb → range', () => {
    const result = parseCommand('bees se pachaas kb')
    const kinds = result.intents.map(i => i.kind)
    expect(kinds).toContain('min_kb')
    expect(kinds).toContain('max_kb')
  })

  it('do sau kb → 200 kb max', () => {
    const result = parseCommand('do sau kb se kam')
    const maxKb = result.intents.find(i => i.kind === 'max_kb')
    expect(maxKb).toBeTruthy()
    expect((maxKb as {kind:string; kb:number}).kb).toBe(200)
  })
})

describe('parseCommand — Devanagari digits', () => {
  it('converts ५० to 50', () => {
    const result = parseCommand('५० kb se kam')
    expect(result.intents.some(i => i.kind === 'max_kb' && (i as {kb:number}).kb === 50)).toBe(true)
  })
})

describe('parseCommand — MB conversion', () => {
  it('1 mb → 1024 kb max', () => {
    const result = parseCommand('under 1 mb')
    const maxKb = result.intents.find(i => i.kind === 'max_kb')
    expect(maxKb).toBeTruthy()
    expect((maxKb as {kind:string; kb:number}).kb).toBe(1024)
  })
})
