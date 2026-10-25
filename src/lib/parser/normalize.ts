/**
 * normalize.ts — text normalization before clause parsing (spec § 7.2 step 1)
 * Never throws. Pure string → string.
 */

/** Devanagari digit → ASCII digit map */
const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
}

/**
 * Devanagari number words → ASCII digits.
 * Must be applied BEFORE other transliterations.
 */
const DEVANAGARI_WORDS: [RegExp, string][] = [
  [/पचास/g, '50'],
  [/तीस/g, '30'],
  [/बीस/g, '20'],
  [/दस/g, '10'],
  [/पाँच/g, '5'],
  [/सौ/g, '100'],
  [/एक/g, '1'],
  [/दो/g, '2'],
  [/तीन/g, '3'],
  [/चार/g, '4'],
]

/**
 * Protected multi-word phrases to normalize BEFORE clause-splitting.
 * Avoids splitting "black and white" into "black" + "white".
 */
const PROTECTED_PHRASES: [RegExp, string][] = [
  [/black\s+and\s+white/g, 'grayscale'],
  [/kaala?\s+safed/g, 'grayscale'],
  [/kala?\s+safed/g, 'grayscale'],
  // range patterns with "and" — protect before clause splitting
  [/between\s+(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)\s*kb/g, '$1 to $2 kb'],
]

/**
 * Ordered list of number-word → digit replacements.
 * Longer phrases must come before shorter ones to avoid partial matches.
 * NOTE: 'do' (2) and 'das' (10) must come LAST to avoid false matches in other words.
 */
const NUMBER_WORDS: [RegExp, string][] = [
  [/\bdo sau\b/g, '200'],
  [/\bteen sau\b/g, '300'],
  [/\bpaanch sau\b/g, '500'],
  [/\bdo hazaar\b/g, '2000'],
  [/\bpaanch\b/g, '5'],
  [/\bchaalees\b/g, '40'],
  [/\bpachaas\b/g, '50'],
  [/\bpachees\b/g, '25'],
  [/\bsaath\b/g, '60'],
  [/\bsattar\b/g, '70'],
  [/\bassi\b/g, '80'],
  [/\bnabbe\b/g, '90'],
  [/\bchaar\b/g, '4'],
  [/\bteen\b/g, '3'],
  [/\btees\b/g, '30'],
  [/\bbees\b/g, '20'],
  [/\bsau\b/g, '100'],
  [/\bek\b/g, '1'],
  // English number words
  [/\bhundred\b/g, '100'],
  [/\btwenty[\s-]?five\b/g, '25'],
  [/\btwenty\b/g, '20'],
  [/\bthirty\b/g, '30'],
  [/\bforty\b/g, '40'],
  [/\bfifty\b/g, '50'],
  [/\bsixty\b/g, '60'],
  [/\bseventy\b/g, '70'],
  [/\beighty\b/g, '80'],
  [/\bninety\b/g, '90'],
  [/\bten\b/g, '10'],
  // 'das' before 'do' to avoid do matching in 'das'
  [/\bdas\b/g, '10'],
  // 'do' is tricky — only replace when NOT preceded by verbal roots (ghuma, kar, bana, etc.)
  // and NOT followed by 'wnload', 'main', etc.
  [/(?<!\b(?:ghuma|kar|bana|hata|rakh)\s*)\bdo\b(?!wnload|main|or|ne)/g, '2'],
]

/** Normalize units to canonical short form */
const UNIT_NORMS: [RegExp, string][] = [
  // KB variants
  [/kilobytes?|kilo[\s]?byte|k\.b\.|केबी/g, 'kb'],
  // MB → kb conversion handled later
  [/megabytes?|mega[\s]?byte|m\.b\./g, 'mb'],
  // Pixels
  [/pixels?|pix|p\.x\./g, 'px'],
  // Centimetres
  [/centim[ée]tres?|centimeter?s?|c\.m\./g, 'cm'],
  // Millimetres — keep as 'mm' so resize_cm pattern can detect and convert
  [/millimetres?|millimeter?s?|m\.m\./g, 'mm'],
]

/** Normalize dimension connectors (between numbers) to 'x' */
function normalizeDimensionConnectors(text: string): string {
  return text
    .replace(/(\d)\s*[×*]\s*(\d)/g, '$1 x $2')
    .replace(/(\d)\s+(?:by|bai|cross|into)\s+(\d)/g, '$1 x $2')
    .replace(/(\d)\s+x\s+(\d)/g, '$1 x $2')
    .replace(/(\d)x(\d)/g, '$1 x $2')
}

/** Main normalization function. */
export function normalize(raw: string): string {
  if (!raw) return ''

  // 1. Lowercase + trim
  let s = raw.toLowerCase().trim()

  // 2. Devanagari word forms → digits (BEFORE digit transliteration)
  for (const [pattern, replacement] of DEVANAGARI_WORDS) {
    s = s.replace(pattern, replacement)
  }

  // 3. Devanagari digits → ASCII
  s = s.replace(/[०-९]/g, ch => DEVANAGARI_DIGITS[ch] ?? ch)

  // 4. Collapse all whitespace to single space
  s = s.replace(/\s+/g, ' ')

  // 5. Protect multi-word phrases BEFORE clause-splitting number word processing
  for (const [pattern, replacement] of PROTECTED_PHRASES) {
    s = s.replace(pattern, replacement)
  }

  // 6. Number words → digits (longer phrases first)
  for (const [pattern, replacement] of NUMBER_WORDS) {
    s = s.replace(pattern, replacement)
  }

  // 7. Normalize units
  for (const [pattern, replacement] of UNIT_NORMS) {
    s = s.replace(pattern, replacement)
  }

  // 8. Handle 'N mb' → 'N*1024 kb' conversion in-text
  s = s.replace(/(\d+(?:\.\d+)?)\s*mb\b/g, (_, n) => {
    const kb = Math.round(parseFloat(n) * 1024)
    return `${kb} kb`
  })

  // 9. Normalize dimension connectors
  s = normalizeDimensionConnectors(s)

  // 10. Final whitespace collapse
  s = s.replace(/\s+/g, ' ').trim()

  return s
}
