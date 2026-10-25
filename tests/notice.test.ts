import { describe, it, expect } from 'vitest'
import { extractNoticeRules } from '../src/lib/notice/extractRules'

describe('extractNoticeRules — Notice Extractor (Spec § 10)', () => {
  it('1. Single-slot Photo notice with pixels, range KB, format, and white background', () => {
    const text = 'Candidate Photograph: The photograph must be 200 x 230 pixels, file size between 20 to 50 KB, saved in JPG format. A plain white background is required.'
    const result = extractNoticeRules(text)
    expect(result.unparsedNotice).toBe(false)
    expect(result.proposals).toHaveLength(1)
    const p = result.proposals[0]
    expect(p.slot).toBe('photo')
    expect(p.intents).toContainEqual({ kind: 'resize_px', width: 200, height: 230 })
    expect(p.intents).toContainEqual({ kind: 'min_kb', kb: 20 })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
    expect(p.intents).toContainEqual({ kind: 'format', format: 'jpeg' })
    expect(p.intents).toContainEqual({ kind: 'white_bg' })
    expect(p.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('2. Single-slot Signature notice with pixels and max size', () => {
    const text = 'Upload Signature: Size of file should be between 10kb - 20kb and dimensions 140x60 pixels in JPG format.'
    const result = extractNoticeRules(text)
    expect(result.unparsedNotice).toBe(false)
    const p = result.proposals.find(p => p.slot === 'signature')
    expect(p).toBeDefined()
    expect(p?.intents).toContainEqual({ kind: 'resize_px', width: 140, height: 60 })
    expect(p?.intents).toContainEqual({ kind: 'min_kb', kb: 10 })
    expect(p?.intents).toContainEqual({ kind: 'max_kb', kb: 20 })
    expect(p?.intents).toContainEqual({ kind: 'format', format: 'jpeg' })
  })

  it('3. Single-slot Thumb impression notice', () => {
    const text = 'Left Thumb Impression: Dimensions 240 x 240 pixels. File size not more than 50 KB. Format: JPG.'
    const result = extractNoticeRules(text)
    expect(result.unparsedNotice).toBe(false)
    const p = result.proposals.find(p => p.slot === 'thumb')
    expect(p).toBeDefined()
    expect(p?.intents).toContainEqual({ kind: 'resize_px', width: 240, height: 240 })
    expect(p?.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
    expect(p?.intents).toContainEqual({ kind: 'format', format: 'jpeg' })
  })

  it('4. Multi-slot Photo and Signature notice', () => {
    const text = `
      Instructions for Upload:
      1. Photograph: Recent passport photograph of size 200 by 230 px and file size under 50 KB in JPEG.
      2. Signature: Signature must be 140 by 60 pixels, size less than 20 KB, JPEG.
    `
    const result = extractNoticeRules(text)
    expect(result.unparsedNotice).toBe(false)
    expect(result.proposals).toHaveLength(2)

    const photo = result.proposals.find(p => p.slot === 'photo')
    expect(photo).toBeDefined()
    expect(photo?.intents).toContainEqual({ kind: 'resize_px', width: 200, height: 230 })
    expect(photo?.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
    expect(photo?.intents).toContainEqual({ kind: 'format', format: 'jpeg' })

    const sig = result.proposals.find(p => p.slot === 'signature')
    expect(sig).toBeDefined()
    expect(sig?.intents).toContainEqual({ kind: 'resize_px', width: 140, height: 60 })
    expect(sig?.intents).toContainEqual({ kind: 'max_kb', kb: 20 })
  })

  it('5. Multi-slot Photo + Signature + Left Thumb comprehensive notice', () => {
    const text = `
      Detailed Guidelines:
      - Passport Photo: 200 x 230 pixels, between 20 and 50 KB, JPG format with white background.
      - Candidate Signature: 140 x 60 pixels, 10 to 20 KB, JPG format.
      - Left Thumb Impression: 240 x 240 pixels, file size within 50 KB, JPG format.
    `
    const result = extractNoticeRules(text)
    expect(result.unparsedNotice).toBe(false)
    expect(result.proposals).toHaveLength(3)

    const photo = result.proposals.find(p => p.slot === 'photo')
    const sig = result.proposals.find(p => p.slot === 'signature')
    const thumb = result.proposals.find(p => p.slot === 'thumb')

    expect(photo?.intents).toContainEqual({ kind: 'resize_px', width: 200, height: 230 })
    expect(photo?.intents).toContainEqual({ kind: 'white_bg' })

    expect(sig?.intents).toContainEqual({ kind: 'resize_px', width: 140, height: 60 })
    expect(sig?.intents).toContainEqual({ kind: 'min_kb', kb: 10 })
    expect(sig?.intents).toContainEqual({ kind: 'max_kb', kb: 20 })

    expect(thumb?.intents).toContainEqual({ kind: 'resize_px', width: 240, height: 240 })
    expect(thumb?.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
  })

  it('6. Notice with CM dimensions', () => {
    const text = 'Photograph specification: width 3.5 cm x height 4.5 cm, file size 20 to 50 kb in JPG.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.slot).toBe('photo')
    expect(p.intents).toContainEqual({ kind: 'resize_cm', widthCm: 3.5, heightCm: 4.5, dpi: 300 })
    expect(p.intents).toContainEqual({ kind: 'min_kb', kb: 20 })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
  })

  it('7. Notice with MM dimensions (converts mm to cm)', () => {
    const text = 'Passport photo dimensions must be 35 x 45 mm, file size not more than 100 KB in JPEG.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.slot).toBe('photo')
    expect(p.intents).toContainEqual({ kind: 'resize_cm', widthCm: 3.5, heightCm: 4.5, dpi: 300 })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 100 })
  })

  it('8. Notice with MB size limit (converts 1 MB to 1024 KB)', () => {
    const text = 'Upload picture: Maximum file size 1 MB, PNG or JPG format.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.slot).toBe('photo')
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 1024 })
  })

  it('9. Notice with Devanagari numerals', () => {
    const text = 'फोटो: २०० x २३० px, आकार ५० kb se kam, JPG format.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.slot).toBe('photo')
    expect(p.intents).toContainEqual({ kind: 'resize_px', width: 200, height: 230 })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
  })

  it('10. Hinglish notice instructions', () => {
    const text = 'Candidate tasveer 200 x 230 pixel mein honi chahiye, 50 kb tak, safed background aur jpg mein.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.slot).toBe('photo')
    expect(p.intents).toContainEqual({ kind: 'resize_px', width: 200, height: 230 })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
    expect(p.intents).toContainEqual({ kind: 'white_bg' })
    expect(p.intents).toContainEqual({ kind: 'format', format: 'jpeg' })
  })

  it('11. Anonymous notice without slot keywords (defaults to activeSlot)', () => {
    const text = 'Image dimensions must be 300 x 300 pixels, file size between 20 to 100 KB, format JPG.'
    const result = extractNoticeRules(text, { activeSlot: 'signature' })
    expect(result.proposals).toHaveLength(1)
    expect(result.proposals[0].slot).toBe('signature')
    expect(result.proposals[0].intents).toContainEqual({ kind: 'resize_px', width: 300, height: 300 })
  })

  it('12. Hindi keyword "हस्ताक्षर" for signature slot', () => {
    const text = 'उम्मीदवार का हस्ताक्षर: आकार 10 से 20 kb, 140 x 60 px, jpeg format.'
    const result = extractNoticeRules(text)
    const p = result.proposals.find(p => p.slot === 'signature')
    expect(p).toBeDefined()
    expect(p?.intents).toContainEqual({ kind: 'resize_px', width: 140, height: 60 })
    expect(p?.intents).toContainEqual({ kind: 'min_kb', kb: 10 })
    expect(p?.intents).toContainEqual({ kind: 'max_kb', kb: 20 })
  })

  it('13. Notice with "width X cm and height Y cm" wording', () => {
    const text = 'Photo: Width is 3.5cm and height is 4.5cm. File size 50 kb max.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.intents).toContainEqual({ kind: 'resize_cm', widthCm: 3.5, heightCm: 4.5, dpi: 300 })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 50 })
  })

  it('14. Notice specifying PNG format', () => {
    const text = 'Left thumb impression should be 200 x 200 px, max 40 kb, in PNG format.'
    const result = extractNoticeRules(text)
    const p = result.proposals[0]
    expect(p.slot).toBe('thumb')
    expect(p.intents).toContainEqual({ kind: 'format', format: 'png' })
    expect(p.intents).toContainEqual({ kind: 'max_kb', kb: 40 })
  })

  it('15. Gibberish text — returns unparsedNotice: true without crashing', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.'
    const result = extractNoticeRules(text)
    expect(result.unparsedNotice).toBe(true)
    expect(result.proposals).toHaveLength(0)
  })

  it('16. Empty string / whitespace — returns unparsedNotice: true without crashing', () => {
    expect(extractNoticeRules('').unparsedNotice).toBe(true)
    expect(extractNoticeRules('    \n\t  ').unparsedNotice).toBe(true)
    // @ts-expect-error test invalid types
    expect(extractNoticeRules(null).unparsedNotice).toBe(true)
    // @ts-expect-error test invalid types
    expect(extractNoticeRules(undefined).unparsedNotice).toBe(true)
  })

  it('17. Multi-slot notice captures clean sourceSnippets for user verification', () => {
    const text = 'Photo: 200x230 px, 50 KB JPG. Signature: 140x60 px, 20 KB JPG.'
    const result = extractNoticeRules(text)
    expect(result.proposals[0].sourceSnippet).toContain('Photo:')
    expect(result.proposals[1].sourceSnippet).toContain('Signature:')
  })
})
