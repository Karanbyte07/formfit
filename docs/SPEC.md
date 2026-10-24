# Form-Ready Image Fixer — Full Project Spec (Handoff Document)

> **Working name:** Form-Ready Image Fixer (final name TBD)
> **Purpose of this file:** a complete, self-contained brief. Any developer or LLM should be able to build the project from this file alone, without the original chat.
> **Event:** *No Hands: The Wispr Challenge* (WeMakeDevs x Wispr Flow), 16–31 Oct 2026. Submissions close **Sat 31 Oct 2026, 11:59 pm IST**.
> **Builder:** Karan (solo). Track: Builders (software).

---

## 0. Instructions to the LLM / developer reading this

1. Build exactly what is described here. Do not add a backend, a database, an LLM call, or any network request.
2. The app must **never crash or show a raw error**. Every failure path ends in a friendly message plus a suggested next action.
3. Everything runs in the browser. User images never leave the device.
4. Prefer small, boring, well-tested code over clever code.
5. The owner builds this **by voice using Wispr Flow** (dictating prompts, README, commit messages). Keep tasks small and well-scoped so they can be dictated as one clear instruction each.
6. Do not copy code, text, or UI from the projects named in section 1.4. They are inspiration only.
7. Open decisions (name, colors, presets) are listed in section 18. Do not invent final answers for them; use the stated defaults and keep them easy to change.

---

## 1. Context

### 1.1 The challenge
A two-week online hackathon. Participants build a tool that fixes a real problem in their own work, and use **Wispr Flow** (a voice-dictation tool that types cleaned-up text into any app) to speak their prompts, specs and docs while building. Keyboard use is allowed for shortcuts and small fixes.

### 1.2 Judging criteria (four questions, weighted; weights were fixed by organizers)
1. Does it solve a real problem in the builder's own work? (specific problem, clear user, tool the person would keep using)
2. Was Wispr used meaningfully? (in the build and the workflow; demo and usage card show it)
3. Does it work? (a live link judges can open and use, without paying or asking for access)
4. Is the demo clear? (a video of up to two minutes anyone can follow)

Separate bonus prizes: *Most Wispr usage* (words dictated 16–31 Oct, read from the Wispr usage card) and *Social/build in public* (#NoHandsChallenge posts).

### 1.3 Submission package (all required)
1. Link to the working project (must open without sign-in; or provide a test login and sample input)
2. Demo video, up to 2 minutes
3. Screenshot of the Wispr usage card (Insights in the desktop app)
4. A few lines: the problem, who it is for, how Wispr was used

Also: weekly check-in (upload usage card, post progress).

### 1.4 Inspiration (not to be copied)
- **Dumpit** (github.com/darshita-builds/Dumpit): browser-only app; speak a messy brain dump, a rule-based parser turns it into a task board. No backend, no API, state in localStorage.
- A fellow participant's **browser PDF editor** driven by spoken commands ("rotate page 3", "move this page to position 1").

**Pattern we take from both:** *one command box + a deterministic rule-based parser + all work done client-side in the browser.* This is why the demo cannot break from API failures.

### 1.5 Why this pattern
- No API keys, no rate limits, no outages, no cost.
- Fast and offline-capable.
- Privacy is a feature: the user's photo/signature never uploads.

---

## 2. Problem statement

> Online forms for jobs, internships and exams set strict upload rules for the applicant's photo and signature, for example *"JPG, 20–50 KB, 200×230 pixels"*. Real photos are usually too heavy or the wrong size, and forms get rejected repeatedly. Fixing it means visiting random websites and uploading a personal photo and signature to servers the user does not trust.

**Target user:** a student or fresher in India filling online application forms (primary: the builder and peers).

**Core promise:** *"Tell it what the form wants. Get a compliant file in seconds. Your photo never leaves your browser."*

---

## 3. Product overview

The user drops in an image (photo, signature, thumb impression). They then **tell the app what to do** by typing or by dictating with Wispr Flow into a single command box, in English or Hinglish, for example:

- `200 by 230 pixel karo, 50 KB se kam, JPG mein`
- `rotate 90 degrees, make background white, compress to under 20 kb`
- `thoda crop karo aur grayscale kar do`

The app:
1. Parses the sentence with a deterministic parser.
2. Shows **"I understood this"** chips (e.g. `Resize 200×230`, `Max 50 KB`, `JPG`) so the user can verify and edit.
3. Applies the operations in a fixed, safe order.
4. Shows a **before/after** preview and a **live compliance checklist** (✓ 38 KB ✓ 200×230 ✓ JPG).
5. Lets the user **undo**, tweak, and **download** (single file or ZIP of all slots).

If the parser does not understand something, it **never errors**; it shows what it did understand, lists what it could not, and offers clickable example chips.

---

## 4. Feature list

### 4.1 MVP (must ship)
| # | Feature | Notes |
|---|---|---|
| M1 | Drag-and-drop / file picker upload | JPG, PNG, WebP. Friendly message for unsupported types (see HEIC, section 12). |
| M2 | Command box (type or dictate) | Single text input, Enter to run, autofocus, multi-clause commands. |
| M3 | Rule-based parser, English + Hinglish | Section 7. |
| M4 | "I understood" chips, editable | Chips are the source of truth; user can edit values or remove chips. |
| M5 | Operations: resize, crop, rotate, flip, grayscale, brightness/contrast, white background | Section 8. |
| M6 | Compress to KB limit | Binary search on JPEG quality (section 9). Also supports a minimum KB. |
| M7 | Format conversion JPG / PNG | PNG has no quality control; handled per section 9.4. |
| M8 | Live compliance checklist | Pass/fail per target: size, dimensions, format. |
| M9 | Before/after slider + original vs new size | |
| M10 | Undo / redo / reset | Non-destructive op list (section 6.3). |
| M11 | Download | Single file with sensible filename. |
| M12 | Try-example button + bundled sample image | So judges can test in 10 seconds with no files and no mic. |
| M13 | Privacy badge | "Processed on your device. Nothing is uploaded." |
| M14 | Graceful errors | Section 12. |

### 4.2 Standout features (build after MVP, in this order)
| # | Feature | Why it matters |
|---|---|---|
| S1 | **Paste the form's notice → auto-extract rules** | Biggest differentiator. Paste e.g. "photograph 20–50 KB, 3.5×4.5 cm, JPG; signature max 30 KB". Regex extracts targets into editable chips. Section 10. |
| S2 | **Multi-slot: Photo + Signature + Thumb impression** | Each slot has its own file, rules, and ops. Download all as ZIP. |
| S3 | **Signature cleaner** | Threshold + white background so scanned signatures look crisp. |
| S4 | **Editable presets** | User-saved rule sets (localStorage). Ship with *empty or clearly-labelled example* presets only (see 18). |
| S5 | **Aspect-locked manual crop box** | Drag to position; ratio from target dimensions. |
| S6 | **Name/date strip under photo** | "Add my name and today's date at the bottom." Only for forms that require it. |
| S7 | **Network-proof demo** | Production CSP with `connect-src 'none'`; demo shows zero requests in DevTools. |
| S8 | **Installable / offline (PWA)** | Optional. Skip if it risks stability. |

### 4.3 Explicitly out of scope
- Any backend, accounts, cloud storage, analytics that make network calls.
- Any LLM or third-party API.
- Automatic face detection or smart cropping (heavy models; breaks easily). Use manual crop instead.
- HEIC decoding in the browser (show a clear message instead).
- Claims about specific exam/form rules. Presets must be user-editable and the app must say "check your form's notice".

---

## 5. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| UI | **React 18/19 + Vite** | TypeScript recommended; plain JS is acceptable if the owner prefers. |
| Styling | **Tailwind CSS** | Design tokens as CSS variables so colors can change in one place. |
| Image processing | **Canvas API** (`createImageBitmap`, `<canvas>`, `canvas.toBlob`) | No libraries needed for core ops. |
| ZIP | **fflate** (or JSZip) | Small, client-side only. |
| Icons | lucide-react | Optional. |
| State | `useReducer` + Context | No Redux/Zustand needed. |
| Storage | `localStorage` (presets, last settings) | Wrap every access in try/catch. |
| Tests | **Vitest** | For the parser, unit conversions, compression search logic. |
| Hosting | **Vercel** (or Netlify) static deploy | No env vars, no serverless functions. |
| Voice | **Wispr Flow (OS level)** | The app contains **no microphone code**. Wispr types into the command input. Optional: add the browser Web Speech API as a fallback for judges without Wispr, behind a feature flag; hide it if unsupported. |
| Fonts | System fonts or self-hosted | **No Google Fonts**, so strict CSP and offline both work. |

---

## 6. Architecture

### 6.1 High level

```
 ┌──────────────────────────── Browser (the only runtime) ────────────────────────────┐
 │                                                                                     │
 │  Wispr Flow (OS)  ──types text──►  CommandBar  ──► Parser ──► Intent[] (chips)      │
 │                                         │                          │                │
 │  DropZone ──File──► Loader ──► Original ImageBitmap                ▼                │
 │                                  │                        OperationList (state)     │
 │                                  ▼                                │                │
 │                          Pipeline (canonical order) ◄─────────────┘                │
 │                                  │                                                  │
 │                                  ▼                                                  │
 │                       Encoder (JPEG/PNG + KB search)                                │
 │                                  │                                                  │
 │            ┌─────────────────────┼──────────────────────┐                           │
 │            ▼                     ▼                      ▼                           │
 │      Preview + slider     Compliance checklist     Download / ZIP                   │
 └─────────────────────────────────────────────────────────────────────────────────────┘
        No server. No API. No network requests after the page loads.
```

### 6.2 Key design principle: parser output is data, not actions
The parser turns text into a typed list of **Intents**. The UI renders Intents as editable chips. Only after chips exist does the **Pipeline** run. This makes the parser fully unit-testable and keeps the user in control.

### 6.3 Non-destructive editing
- Keep the **original `ImageBitmap`** in memory for the whole session.
- The "document" is `{ original, ops[], targets }`.
- Rendering = apply `ops` to `original` from scratch.
- **Undo** = pop the last op batch. **Reset** = clear `ops`. No pixel data is mutated in place.

### 6.4 Canonical operation order
Regardless of the order the user speaks them, ops run in this fixed order:

1. Orientation: rotate, flip (respect EXIF; `createImageBitmap` default handles it)
2. Crop
3. Resize (to target pixels or max dimension)
4. Color: grayscale, brightness, contrast, white background / threshold (signature cleaner)
5. Overlays: name/date strip (S6)
6. Encode: format + quality search to hit the KB range

Reason: crop-then-resize and encode-last avoids quality loss and makes KB targeting exact.

### 6.5 Working-copy safeguard
If the input is larger than a safe limit (default longest side **4000 px**, or > ~16 MP), first downscale to a working copy. Prevents memory and canvas-size failures on phones and low-end laptops.

---

## 7. Command parser

### 7.1 Responsibilities
- Input: raw string (English, Hinglish in Roman script; optionally a few Devanagari keywords).
- Output: `{ intents: Intent[], unknown: string[], confidence }`.
- **Never throws.** Unknown fragments go into `unknown` and are shown to the user.

### 7.2 Pipeline
1. **Normalize:** lowercase; collapse whitespace; convert Devanagari digits to ASCII; map number words (`fifty`, `pachaas`, `bees`, `tees`) to digits where unambiguous; normalize `×`, `x`, `by`, `bai`, `cross` to a single `x` token between numbers; normalize `kilobyte(s)`, `kilo byte`, `केबी` to `kb`; `mb` to `kb` (×1024); `pixels|pixel|px|pix` to `px`.
2. **Split into clauses** on: `,`, `.`, ` and `, ` aur `, ` then `, ` phir `, ` also `, ` aur fir `.
3. **Match each clause** against the intent patterns (7.3). A clause may yield several intents (e.g. "200 by 230 pixel aur 50 kb").
4. **Collect unmatched text** into `unknown`.
5. **Conflict resolution:** later intent of the same kind overrides earlier (e.g. two sizes). Warn in the UI.

### 7.3 Intent types and patterns (illustrative; implement as a table of `{kind, regex[], extract}` so new phrases are one-line additions)

| Intent | Example phrases (English / Hinglish) | Extracted fields |
|---|---|---|
| `resize_px` | `200 by 230 pixel`, `resize to 200x230`, `200 x 230 karo` | width, height |
| `resize_cm` | `3.5 x 4.5 cm`, `3.5 by 4.5 centimeter` | width_cm, height_cm, (dpi chip, default 300) |
| `max_kb` | `under 50 kb`, `50 kb se kam`, `max 50kb`, `50 kb tak`, `50 kb ke andar`, `less than 50 kb`, `below 50 kb` | max_kb |
| `min_kb` | `at least 20 kb`, `20 kb se zyada`, `minimum 20 kb` | min_kb |
| `range_kb` | `20 to 50 kb`, `20-50 kb`, `20 se 50 kb` | min_kb, max_kb |
| `format` | `jpg`, `jpeg`, `png`, `jpg mein`, `convert to png` | format |
| `rotate` | `rotate 90`, `90 degree ghuma do`, `rotate left/right`, `seedha karo` (no-op hint) | degrees (90/180/270, ±) |
| `flip` | `flip horizontal`, `mirror`, `ulta karo` | axis |
| `grayscale` | `grayscale`, `black and white`, `kaala safed` | — |
| `brightness` | `brighter`, `thoda bright karo`, `darker`, `brightness +20` | delta (default ±15 for "thoda") |
| `contrast` | `more contrast`, `contrast badhao` | delta |
| `white_bg` | `white background`, `background safed karo` | — |
| `crop_auto_ratio` | `crop to passport ratio`, `crop karo` | opens crop box with ratio from targets, if any |
| `undo` / `reset` | `undo`, `wapas karo`, `reset`, `shuru se` | — |
| `download` | `download`, `save karo` | — |

Vague quantity words (`thoda`, `zara`, `little`, `a bit`) map to small default deltas shown in the chip; the user can edit.

### 7.4 Unit handling
- KB: 1 KB = 1024 bytes (state this in the UI tooltip; some forms use 1000). Provide a toggle "1 KB = 1000 bytes" in settings, default 1024. For safety, **aim slightly under the max** (e.g. 97% of the limit) to avoid off-by-rounding rejections.
- cm to px: `px = round(cm / 2.54 * dpi)`, default **300 dpi**, shown as an editable chip. Never hide the assumption.

### 7.5 Parser test corpus (acceptance for the "accuracy" number in the demo)
Maintain `tests/commands.json` with **at least 60 commands** (≥30 English, ≥30 Hinglish), each with expected intents. Include messy cases (extra words, wrong order, mixed language). Report `passed/total` in the README; this is the demo's real-result number.

---

## 8. Image operations

| Op | Implementation notes |
|---|---|
| Rotate | Draw to a new canvas with swapped width/height for 90/270. |
| Flip | `ctx.scale(-1, 1)` with translate. |
| Crop | Source rect from manual crop box; default center-crop to target aspect ratio if no box set. |
| Resize | `drawImage` to target size with `imageSmoothingQuality = 'high'`. For large downscale ratios, do **step-down** (halve repeatedly) to avoid aliasing. |
| Grayscale | Per-pixel luminance `0.299R + 0.587G + 0.114B` on `ImageData`. |
| Brightness/contrast | Per-pixel linear adjustment, clamp 0–255. |
| White background | Fill white before drawing (fixes transparent PNGs becoming black in JPEG). |
| Signature cleaner (S3) | Convert to grayscale, apply adaptive or fixed threshold, push near-white to pure white, keep ink dark. Provide a threshold slider. |
| Name/date strip (S6) | Extend canvas bottom by N px, fill white, draw text with a safe system font; preview before commit. |

---

## 9. Compression to a KB target (core algorithm)

### 9.1 Goal
Produce a file whose size is within `[min_kb, max_kb]` while keeping **target pixel dimensions fixed** (if the form specifies them).

### 9.2 Algorithm (JPEG)
```
low = 0.05, high = 0.95, best = null
repeat up to ~10 iterations:
    q = (low + high) / 2
    blob = canvas.toBlob('image/jpeg', q)
    if blob.size <= max_bytes:
        best = blob; low = q        // try higher quality
    else:
        high = q                    // too big, reduce quality
return best (the largest-quality blob that fits)
```
- Deterministic, ~10 encodes, fast for form-sized images.
- Target `max_bytes = max_kb * 1024 * 0.97` for a safety margin.

### 9.3 If the target cannot be met
Decision tree (all outcomes are friendly messages, never exceptions):
1. **Still too big at the minimum quality and dimensions are fixed:** tell the user plainly (*"This image can't reach 20 KB at 200×230 without looking very poor. Try a simpler background or a lower pixel size if the form allows."*). Offer: *"Apply best effort (smallest possible)"*.
2. **Dimensions are not fixed:** progressively downscale (e.g. ×0.9 steps) and repeat the quality search, up to a floor (e.g. 50% of original).
3. **Result is below `min_kb`:** raise quality toward 1.0. If still below, offer *"Pad file to reach minimum size"* (stretch): append a harmless JPEG comment (COM) segment so the file remains a valid JPEG. State clearly what this does.

### 9.4 PNG
`toBlob('image/png')` ignores quality. If a KB limit is requested with PNG output: warn and suggest JPG; offer to convert. Do not silently change format.

### 9.5 Verification
After encoding, **re-read** the final blob: `blob.size`, decode via `createImageBitmap(blob)` to confirm real width/height, and check `blob.type`. The checklist shows those measured values, not the intended ones.

---

## 10. "Paste the form notice" extractor (S1)

User pastes free text from a form's instructions. Deterministic regex extraction proposes rules per slot.

### 10.1 Steps
1. Normalize text (as in 7.2).
2. **Segment by slot keywords:** `photo|photograph|picture|pic` → photo; `signature|sign` → signature; `thumb|left thumb|impression` → thumb. Text between keywords belongs to the preceding slot. If no keywords, treat as a single anonymous slot.
3. **Extract targets per segment:**
   - Size range: `(\d+)\s*(?:to|-|–|and)\s*(\d+)\s*kb`
   - Max: `(?:max(?:imum)?|not more than|up ?to|below|under|less than|within)\s*(\d+)\s*(kb|mb)`
   - Min: `(?:min(?:imum)?|at least|not less than|above|more than)\s*(\d+)\s*kb`
   - Pixels: `(\d+)\s*(?:x|by)\s*(\d+)\s*(?:px|pixels?)`; cm variant with `cm|mm` (mm → cm ÷ 10).
   - Format: `\b(jpe?g|png)\b`.
4. Output `{slot, rules, confidence, sourceSnippet}[]`.
5. **Always show the result as editable chips with the matched source text highlighted**, and require the user to confirm. If nothing is found, say so and show an example of a notice that works.

### 10.2 Honesty rule
The app must say: *"Rules shown are read from the text you pasted. Always double-check them against your form."* The app never ships hard-coded rules for specific exams as facts.

---

## 11. UI / UX

### 11.1 Layout (single page, no router)
- **Header:** logo/name, privacy badge, "Try example", "Paste form notice" button.
- **Main (two columns on desktop, stacked on mobile):**
  - **Left:** slot tabs (Photo | Signature | Thumb) + drop zone / preview with **before/after slider**.
  - **Right:** **Command bar** (large input, mic hint "Hold your Wispr key and speak"), **Understood chips**, **Compliance checklist**, history list (undo/redo), **Download** button(s).
- **Footer:** short "How it works", "Built by voice with Wispr Flow", inspiration credit.

### 11.2 Command bar details
- Large, autofocused, placeholder rotates examples (English + Hinglish).
- Example chips below it (click to fill the box and run): e.g. `200 x 230 px, under 50 KB, JPG`, `50 kb se kam karo`, `rotate 90 and white background`.
- Press Enter to run. Show a subtle "Listening for Wispr..." hint only as static text (no mic code).
- Always works with typing. Never required to have a mic.

### 11.3 "Understood" chips
- Colored chips per intent, each with an editable value and an ✕.
- A separate muted row: *"Couldn't understand: '...'. Try: [example chips]"*.

### 11.4 Compliance checklist
Rows: `File size`, `Dimensions`, `Format`. Each shows target vs actual with ✓ / ✗ and a one-line fix suggestion on ✗.

### 11.5 States to design explicitly
Empty, loading (large image), success, partial (best effort), unsupported file, parse-nothing, storage unavailable, narrow mobile screen.

### 11.6 Accessibility
Keyboard operable; visible focus; `aria-live="polite"` region announcing results ("Done. 38 KB, 200 by 230, JPG"); sufficient contrast; the slider is operable with arrow keys.

### 11.7 Visual direction
**TBD by the owner** (see section 18). Default proposal: clean and light, one accent color, generous spacing, large before/after preview as the hero. Colors defined as CSS variables.

---

## 12. Error handling and edge cases (zero-crash policy)

| Situation | Behavior |
|---|---|
| HEIC/HEIF or other undecodable file | Friendly message: "This format can't be opened in the browser. Export as JPG or PNG and try again." No crash. |
| Huge image (≥ ~16 MP) | Auto-downscale to working copy; tell the user quietly. |
| `createImageBitmap` / canvas failure | Catch, show message, keep previous state intact. |
| `toBlob` returns `null` | Treat as failure; retry once at lower quality; then friendly message. |
| Parser finds nothing | Show example chips; do not clear existing ops. |
| Conflicting commands | Last wins; show a small notice. |
| Target impossible (section 9.3) | Explain plainly; offer best effort. |
| localStorage unavailable | Continue in memory; presets just won't persist. |
| Very small image upscaled a lot | Warn that quality will suffer; allow proceeding. |
| User drops multiple files into one slot | Take the first; offer to assign the others to other slots. |
| Non-image file | Reject with message. |
| Memory pressure (mobile) | Release old bitmaps (`bitmap.close()`) when replaced. |

Global: wrap top-level in an **Error Boundary** that shows a "Something went wrong, your files are safe, click to reset" screen. Add no remote error logging.

---

## 13. Data model (TypeScript-style)

```ts
type Format = 'jpeg' | 'png';

type Intent =
  | { kind: 'resize_px'; width: number; height: number }
  | { kind: 'resize_cm'; widthCm: number; heightCm: number; dpi: number }
  | { kind: 'max_kb'; kb: number }
  | { kind: 'min_kb'; kb: number }
  | { kind: 'format'; format: Format }
  | { kind: 'rotate'; degrees: 90 | 180 | 270 }
  | { kind: 'flip'; axis: 'h' | 'v' }
  | { kind: 'grayscale' }
  | { kind: 'brightness'; delta: number }
  | { kind: 'contrast'; delta: number }
  | { kind: 'white_bg' }
  | { kind: 'crop'; rect?: { x: number; y: number; w: number; h: number } }
  | { kind: 'signature_clean'; threshold: number }
  | { kind: 'overlay_text'; text: string };

interface Targets {
  widthPx?: number; heightPx?: number;
  minKb?: number; maxKb?: number;
  format?: Format;
}

interface Slot {
  id: 'photo' | 'signature' | 'thumb';
  fileName?: string;
  original?: ImageBitmap;
  ops: Intent[];            // user-confirmed intents (chips)
  history: Intent[][];      // for undo/redo
  targets: Targets;         // derived from chips / pasted notice
  result?: { blob: Blob; width: number; height: number; kb: number; format: Format };
}

interface AppState {
  slots: Record<Slot['id'], Slot>;
  activeSlot: Slot['id'];
  settings: { kbBase: 1024 | 1000; dpi: number; safetyMargin: number };
  presets: { name: string; targets: Targets }[];
}
```

---

## 14. Suggested project structure

```
form-ready-image-fixer/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ vercel.json                 # production headers (CSP) + SPA fallback if needed
├─ public/
│  ├─ favicon.svg
│  └─ sample-photo.jpg         # synthetic/illustrative sample, NOT a real person
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ state/
│  │  ├─ reducer.ts
│  │  └─ context.tsx
│  ├─ lib/
│  │  ├─ parser/
│  │  │  ├─ normalize.ts
│  │  │  ├─ intents.ts        # table of patterns
│  │  │  └─ parse.ts
│  │  ├─ notice/
│  │  │  └─ extractRules.ts   # S1
│  │  ├─ image/
│  │  │  ├─ load.ts           # file → ImageBitmap, working-copy downscale
│  │  │  ├─ pipeline.ts       # canonical-order apply
│  │  │  ├─ ops.ts            # rotate/flip/crop/resize/color
│  │  │  ├─ encode.ts         # toBlob + quality search
│  │  │  └─ verify.ts         # re-decode and measure result
│  │  ├─ units.ts             # kb/cm/px conversions
│  │  ├─ zip.ts               # fflate wrapper
│  │  └─ storage.ts           # safe localStorage
│  ├─ components/
│  │  ├─ DropZone.tsx
│  │  ├─ CommandBar.tsx
│  │  ├─ ExampleChips.tsx
│  │  ├─ UnderstoodChips.tsx
│  │  ├─ CompareSlider.tsx
│  │  ├─ Checklist.tsx
│  │  ├─ CropBox.tsx          # S5
│  │  ├─ HistoryBar.tsx
│  │  ├─ NoticeDialog.tsx     # S1
│  │  ├─ PresetsPanel.tsx     # S4
│  │  ├─ PrivacyBadge.tsx
│  │  └─ ErrorBoundary.tsx
│  └─ index.css               # CSS variables (design tokens) + Tailwind
└─ tests/
   ├─ commands.json           # ≥60 command → intents cases
   ├─ parser.test.ts
   ├─ notice.test.ts
   ├─ units.test.ts
   └─ encode-search.test.ts   # binary-search logic with a mocked encoder
```

---

## 15. Security, privacy and deployment

- **No network requests after load.** No analytics, no remote fonts, no CDN scripts at runtime.
- Production **CSP** via `vercel.json` headers, for example:
  `default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'`
  (Verify it does not break the production build; do not apply it to the Vite dev server.)
- Object URLs created with `URL.createObjectURL` must be revoked when no longer needed.
- Deploy: push to GitHub, import into Vercel, no environment variables. Verify the production URL opens in an **incognito window with no sign-in**.
- README must include: how it works, privacy statement, how to run locally, parser accuracy number, "inspired by" credits.

---

## 16. Testing and quality gates

**Unit tests (Vitest):**
- Parser: ≥60 cases, report pass rate.
- Notice extractor: ≥15 realistic pasted-notice samples (invented by the builder; do not claim they come from a real exam).
- Units: KB base conversions, cm→px at several DPIs.
- Compression search: simulate an encoder with a monotonic size-vs-quality function; assert convergence, margin, and "impossible target" outcomes.

**Manual QA checklist before submission:**
- [ ] Chrome and Edge desktop; Chrome on Android; Safari if available
- [ ] 5 real photos of different sizes (including a 5 MB+ phone photo)
- [ ] 3 real signatures (scanned and phone-photo)
- [ ] Transparent PNG becomes white-background JPG correctly
- [ ] Impossible target shows the friendly message
- [ ] HEIC file shows the friendly message
- [ ] Command with typos and mixed Hinglish does not crash
- [ ] Works with the mic fully off (typing only)
- [ ] DevTools Network tab shows zero requests after load
- [ ] Production link opens in incognito with no sign-in

**Definition of done:** all MVP features pass the checklist, tests green, deployed link works for a stranger in under 10 seconds using "Try example".

---

## 17. Wispr Flow usage plan (for judging criterion 2 and the usage prizes)

- **Setup:** install via the challenge link (1 month Flow Pro free), grant microphone permission (and Accessibility on Mac), set the hotkey (Mac default Fn; Windows commonly Ctrl+Win). Make the **first dictation** a statement of the problem and what the tool should do.
- **Dictate everything possible:** prompts to the coding assistant (Claude Code / Cursor), this spec's follow-ups, README, commit messages, issue notes, social posts, weekly check-in text.
- **In-app voice story for the demo:** the user holds the Wispr key, says *"200 by 230 pixel karo, 50 KB se kam, JPG mein"*, and the text appears in the command bar. The app itself needs no speech code.
- **Evidence to collect:** weekly usage-card screenshots (Insights → Your usage), final usage-card screenshot for 16–31 Oct, short screen recordings of dictation during the build.
- **Note:** Flow cleans up filler words and short commands add few words, so the *build-time* dictation (prompts, docs, commits) is what drives the usage count.

---

## 18. Open decisions (owner to confirm; use defaults until then)

| Decision | Default |
|---|---|
| Project name | "Form-Ready Image Fixer" (placeholder) |
| Visual direction | Clean, light, single accent color; CSS-variable tokens |
| Presets | Empty or labelled "example" only; user adds their own from their real forms |
| DPI for cm conversion | 300 (editable chip) |
| KB base | 1024 (toggle for 1000) |
| TypeScript vs JS | TypeScript |
| Web Speech API fallback | Off by default (Wispr is the voice path) |
| PWA/offline | Stretch only |

---

## 19. Build plan (7 days, from Sat 24 Oct to Sat 31 Oct 2026)

| Day | Goal | Output |
|---|---|---|
| **Sat 24** | Project setup, deploy skeleton, Wispr first-dictation, design tokens | Repo, Vercel link live with empty shell |
| **Sun 25** | Image core: load, canonical pipeline, resize/rotate/crop, preview | Image loads and transforms without UI polish |
| **Mon 26** | Compression search + verify + checklist + download | A file can be forced under a KB target, verified |
| **Tue 27** | Parser + chips + example chips + undo/redo | Command box drives the pipeline; parser tests ≥ 40 cases |
| **Wed 28** | Notice-paste extractor, multi-slot, ZIP | Standout feature S1 and S2 working |
| **Thu 29** | Signature cleaner, crop box, error states, accessibility, mobile layout | Edge cases handled; QA checklist pass 1 |
| **Fri 30** | Real-data run (photos/signatures), parser accuracy number, README, record demo video (≤ 2 min), social post | Submission assets ready |
| **Sat 31** | Final QA in incognito, usage-card screenshot, submit **before 11:59 pm IST** (aim for afternoon) | Submitted |

Weekly check-in: upload the usage card and post progress (include `#NoHandsChallenge`, tag WeMakeDevs and Wispr Flow).

If time runs short, cut in this order: S8, S6, S5, S4, S3. **Never cut:** M1–M14, S1, S7.

---

## 20. Demo script (≤ 2 minutes)

1. **0:00–0:15 Problem:** "My form rejected my photo again: 'JPG, under 50 KB, 200×230'."
2. **0:15–0:35 Privacy hook:** show the page, the badge, and the empty Network tab.
3. **0:35–1:10 Voice command:** drop a heavy real photo (e.g. 2.4 MB), hold the Wispr key, say the command. Chips appear, checklist turns green, before/after slider.
4. **1:10–1:30 Standout:** paste a form notice; rules fill in automatically.
5. **1:30–1:50 Signature + ZIP:** clean the signature, download all as ZIP.
6. **1:50–2:00 Result and CTA:** "800 KB to 45 KB, form accepted. N of M spoken commands understood correctly. Link in description."

---

## 21. Submission write-up template

> **Problem:** Online application forms reject photos and signatures that don't meet strict size/format rules, and the usual fix means uploading personal images to unknown websites.
> **User:** Students and freshers filling online forms in India (including me).
> **Solution:** A browser-only tool where you say or type what the form needs, in English or Hinglish. It resizes, crops, compresses to a KB range and verifies compliance on your device. Nothing is uploaded.
> **How I used Wispr Flow:** I dictated [prompts to my coding assistant, this spec, the README, commit messages] and use Flow to give the app its commands. [N words dictated 16–31 Oct per usage card.]
> **Real result:** [X real photos/signatures made form-ready; example 812 KB → 45 KB at 200×230; parser understood N of M test commands.]

---

## 22. Prompt starter for the next LLM

> "You are helping me build the project described in the attached spec (`FormReady-Image-Fixer-SPEC.md`). Follow section 0 strictly: client-side only, no backend, no API, zero-crash error handling. We are on **Day N** of the build plan in section 19. Start with the day's goal. Work in small steps. After each step tell me exactly what to run and what I should see. Do not change the architecture or add dependencies without asking."

---

## 23. Glossary

- **Wispr Flow:** voice-dictation app that types cleaned-up text into whatever app has the cursor.
- **Intent:** a typed, parsed command (e.g. `max_kb: 50`).
- **Chip:** the UI representation of an Intent, editable by the user.
- **Slot:** one image role (photo, signature, thumb) with its own file, ops and targets.
- **Canonical order:** the fixed sequence in which operations are applied.
- **Working copy:** a downscaled copy used to keep memory safe on large inputs.
