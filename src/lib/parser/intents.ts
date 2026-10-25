/**
 * intents.ts — declarative table of intent patterns (spec § 7.3)
 * Each rule maps a regex to an intent extractor function.
 * Never throws — all extractors return null on no match.
 */
import type { Intent, Format } from '../../types'

export interface IntentRule {
  kind: string
  patterns: RegExp[]
  extract: (match: RegExpMatchArray, clause: string) => Intent | Intent[] | null
}

/** Filler words/phrases to strip before attempting classification */
export const FILLER_WORDS = /\b(?:please|bhai|yaar|kar do|karo|make it|image ko|photo ko|mujhe|mein|aur|phir|bas|zara|thodi|thoda si|image|photo|file|please)\b/g

// ─── Individual rule definitions ────────────────────────────────────────────

const RULES: IntentRule[] = [
  // ── resize_cm ─────────────────────────────────────────────────────────────
  {
    kind: 'resize_cm',
    patterns: [
      /(\d+(?:\.\d+)?)\s+x\s+(\d+(?:\.\d+)?)\s*cm/,
      /(\d+(?:\.\d+)?)\s+x\s+(\d+(?:\.\d+)?)\s*mm/,
      /(\d+(?:\.\d+)?)\s+x\s+(\d+(?:\.\d+)?)\s*(?:centimeter|centimetre|millimeter|millimetre)/,
    ],
    extract: (m, clause) => {
      const isMm = /mm|milli/.test(clause) || /mm/.test(m[0])
      let w = parseFloat(m[1])
      let h = parseFloat(m[2])
      if (!w || !h) return null
      if (isMm) { w = w / 10; h = h / 10 }
      return { kind: 'resize_cm', widthCm: w, heightCm: h, dpi: 300 }
    },
  },

  // ── resize_px ─────────────────────────────────────────────────────────────
  {
    kind: 'resize_px',
    patterns: [
      // "200 x 230 px" / "200x230" / "resize to 200x230"
      /(\d+)\s+x\s+(\d+)\s*px/,
      /resize\s+to\s+(\d+)\s+x\s+(\d+)/,
      /(\d+)\s+x\s+(\d+)\s+(?:pixel|mein|karo|kar)/,
      /(\d+)\s+x\s+(\d+)(?!\s*(?:cm|mm|in|inch))\b/,
    ],
    extract: (m, clause) => {
      const w = parseInt(m[1], 10)
      const h = parseInt(m[2], 10)
      if (!w || !h) return null
      const hasUnit = /px|pixel|resize\s+to|mein|karo|kar/.test(clause)
      if (!hasUnit && (w < 50 || h < 50)) return null
      if (w < 10 || h < 10) return null
      return { kind: 'resize_px', width: w, height: h }
    },
  },

  // ── range_kb ──────────────────────────────────────────────────────────────
  {
    kind: 'range_kb',
    patterns: [
      /(\d+)\s*(?:to|-|–|se)\s*(\d+)\s*kb/,
      /between\s+(\d+)\s+and\s+(\d+)\s*kb/,
    ],
    extract: (m) => {
      const lo = parseInt(m[1], 10)
      const hi = parseInt(m[2], 10)
      if (!lo || !hi) return null
      return [
        { kind: 'min_kb', kb: Math.min(lo, hi) },
        { kind: 'max_kb', kb: Math.max(lo, hi) },
      ]
    },
  },

  // ── max_kb ────────────────────────────────────────────────────────────────
  {
    kind: 'max_kb',
    patterns: [
      /(?:under|below|max(?:imum)?|less\s+than|compress\s+to|within)\s+(\d+)\s*kb/,
      /(\d+)\s*kb\s+(?:se\s+kam|tak|ke\s+andar)/,
      /(\d+)\s*kb\s+(?:karo|kar)/,
    ],
    extract: (m) => {
      const kb = parseInt(m[1], 10)
      if (!kb) return null
      return { kind: 'max_kb', kb }
    },
  },

  // ── min_kb ────────────────────────────────────────────────────────────────
  {
    kind: 'min_kb',
    patterns: [
      /(?:at\s+least|minimum|min|above|more\s+than)\s+(\d+)\s*kb/,
      /(\d+)\s*kb\s+se\s+(?:zyada|upar)/,
    ],
    extract: (m) => {
      const kb = parseInt(m[1], 10)
      if (!kb) return null
      return { kind: 'min_kb', kb }
    },
  },

  // ── format ────────────────────────────────────────────────────────────────
  {
    kind: 'format',
    patterns: [
      /\b(?:convert\s+to|save\s+as|in|mein|as)\s+(jpe?g|png)\b/,
      /\b(jpe?g|png)\s+(?:format|mein|me)\b/,
      /\b(jpe?g|png)\b/,
    ],
    extract: (m) => {
      const raw = m[1].toLowerCase()
      const fmt: Format = raw === 'jpg' || raw === 'jpeg' ? 'jpeg' : 'png'
      return { kind: 'format', format: fmt }
    },
  },

  // ── rotate ────────────────────────────────────────────────────────────────
  {
    kind: 'rotate',
    patterns: [
      /rotate\s+(90|180|270)(?:\s*degrees?)?/,
      /(90|180|270)\s*(?:degree|deg)?\s*(?:ghuma\s*do|ghumao|rotate)/,
      /rotate\s+(?:right|clockwise)/,
      /rotate\s+(?:left|anti[\s-]?clockwise|counter[\s-]?clockwise)/,
      /ulta\s+ghuma\s*do/,
      /seedha\s+karo/,
    ],
    extract: (m, clause) => {
      // Detect degree from match
      const degStr = m[1]
      let degrees: 90 | 180 | 270 = 90
      if (degStr) {
        const n = parseInt(degStr, 10)
        if (n === 180) degrees = 180
        else if (n === 270) degrees = 270
        else degrees = 90
      } else if (/rotate\s+right|clockwise/.test(clause)) {
        degrees = 90
      } else if (/rotate\s+left|anti|counter/.test(clause)) {
        degrees = 270
      } else if (/ulta\s+ghuma/.test(clause)) {
        degrees = 180
      } else if (/seedha\s+karo/.test(clause)) {
        // no-op: seedha karo means "straighten" — treat as 0, which we skip
        return null
      }
      return { kind: 'rotate', degrees }
    },
  },

  // ── flip ──────────────────────────────────────────────────────────────────
  {
    kind: 'flip',
    patterns: [
      /flip\s+(?:horizontal|h)\b/,
      /flip\s+(?:vertical|v)\b/,
      /\bmirror(?:\s+karo)?\b/,
      /ulta\s+karo/,
    ],
    extract: (_m, clause) => {
      const axis: 'h' | 'v' = /vertical|v\b/.test(clause) ? 'v' : 'h'
      return { kind: 'flip', axis }
    },
  },

  // ── grayscale ─────────────────────────────────────────────────────────────
  {
    kind: 'grayscale',
    patterns: [
      /gr[ae]yscale/,
      /black\s+and\s+white/,
      /b\s*&\s*w\b/,
      /kaala?\s+safed/,
      /kala?\s+safed/,
    ],
    extract: () => ({ kind: 'grayscale' }),
  },

  // ── brightness ────────────────────────────────────────────────────────────
  {
    kind: 'brightness',
    patterns: [
      /brightness\s*([+-]\d+)/,
      /\bbrighter\b/,
      /thoda\s+bright/,
      /roshni\s+badhao/,
      /\bdarker\b/,
      /thoda\s+dark/,
      /brightness\s+(\d+)/,
    ],
    extract: (m, clause) => {
      // Explicit delta
      if (m[1] && /^[+-]?\d+$/.test(m[1])) {
        const sign = m[1].startsWith('-') ? -1 : 1
        const delta = parseInt(m[1].replace(/^[+-]/, ''), 10) * sign
        return { kind: 'brightness', delta }
      }
      // Named qualitative
      if (/\bdarker\b|thoda\s+dark/.test(clause)) {
        return { kind: 'brightness', delta: -15 }
      }
      // brighter / roshni badhao / thoda bright
      return { kind: 'brightness', delta: 15 }
    },
  },

  // ── contrast ──────────────────────────────────────────────────────────────
  {
    kind: 'contrast',
    patterns: [
      /contrast\s*([+-]\d+)/,
      /more\s+contrast/,
      /contrast\s+badhao/,
      /less\s+contrast/,
      /contrast\s+kam/,
    ],
    extract: (m, clause) => {
      if (m[1] && /^[+-]?\d+$/.test(m[1])) {
        const sign = m[1].startsWith('-') ? -1 : 1
        const delta = parseInt(m[1].replace(/^[+-]/, ''), 10) * sign
        return { kind: 'contrast', delta }
      }
      if (/less\s+contrast|contrast\s+kam/.test(clause)) {
        return { kind: 'contrast', delta: -15 }
      }
      return { kind: 'contrast', delta: 15 }
    },
  },

  // ── white_bg ──────────────────────────────────────────────────────────────
  {
    kind: 'white_bg',
    patterns: [
      /white\s+background/,
      /background\s+safed/,
      /safed\s+background/,
      /bg\s+white/,
      /make\s+background\s+white/,
      /background\s+white/,
    ],
    extract: () => ({ kind: 'white_bg' }),
  },

  // ── undo ──────────────────────────────────────────────────────────────────
  {
    kind: 'undo',
    patterns: [
      /\bundo(?:\s+karo)?\b/,
      /wapas\s+karo/,
      /piche\s+jao/,
    ],
    extract: () => ({ kind: 'undo' } as unknown as Intent),
  },

  // ── reset ─────────────────────────────────────────────────────────────────
  {
    kind: 'reset',
    patterns: [
      /\breset\b/,
      /shuru\s+se/,
      /sab\s+hatao/,
      /clear\s+all/,
    ],
    extract: () => ({ kind: 'reset' } as unknown as Intent),
  },

  // ── download ──────────────────────────────────────────────────────────────
  {
    kind: 'download',
    patterns: [
      /\bdownload(?:\s+karo)?\b/,
      /save\s+karo/,
    ],
    extract: () => ({ kind: 'download' } as unknown as Intent),
  },
]

export { RULES }
