# FormFit — Bolo. Fit karo. Form bharo.

> **Voice-first, 100% client-side image & signature compliance tool for Indian online forms.**  
> Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-0F766E?style=for-the-badge&logo=vercel)](https://formfit.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Vitest-189%20Passing%20(100%25)-15803D?style=for-the-badge&logo=vitest)](https://github.com/Karanbyte07/formfit)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline%20Canvas-0F766E?style=for-the-badge&logo=shield)](https://github.com/Karanbyte07/formfit)

🔗 **Live App on Vercel:** [https://formfit.vercel.app](https://formfit.vercel.app)

---

## ⚡ 10-Second Judge Quick-Test (Zero Files & No Mic Required)

You can verify the entire pipeline in **10 seconds** without uploading your own images or needing a microphone:

1. **Open the live link**: [https://formfit.vercel.app](https://formfit.vercel.app)
2. **Load Sample Image**: Click **"Try sample"** on the Photo tab.
3. **Execute a Spoken Command**: Click any `"Try saying"` chip below the command box (e.g. `200 x 230 px, under 50 KB, JPG` or `50 kb se kam karo`).
   - Notice how the intent parses instantly, creates editable green chips, compresses the photo, and turns the **Compliance Checklist** green.
4. **Inspect Before/After**: Drag the split-screen slider to see real-time side-by-side quality comparison.
5. **Auto-Extract Notice Rules (Standout S1)**:
   - Click **"Paste form notice"** in the top bar.
   - Click **"Try sample notice"** -> **"Apply rules to slots"**.
   - Notice how rules for **Photo**, **Signature**, and **Thumb** are extracted and mapped simultaneously.
6. **Clean Signature & One-Click ZIP (Standouts S2 & S3)**:
   - Switch to the **Signature** tab -> Click **"Try sample"** -> Click **"✨ Clean ink"**. The paper background becomes pure white while dark ink strokes are crispened.
   - Click **"Download all (ZIP)"** in the top bar to get all compliant assets packaged in one client-side archive.

---

## 🛑 The Problem

Every year, millions of students and job applicants across India apply for government exams (UPSC, SSC, IBPS, State PSCs), university admissions, and passport/visa portals. Almost all of these portals enforce strict, pedantic image specifications:
- **"Photo must be exactly 200 × 230 pixels, between 20 KB and 50 KB, in JPG format."**
- **"Signature must be 140 × 60 pixels, between 10 KB and 20 KB, on a pure white background."**

If an upload is even 1 pixel off or 50.2 KB, the portal throws a generic error. Desperate applicants turn to random online "image compressor" websites, uploading sensitive photos, signatures, and thumb impressions containing identity markers to untrusted third-party servers.

---

## 💡 The Solution

**FormFit** is a browser-only, voice-driven image compliance tool:
1. **Hold your Wispr Flow hotkey and speak** in English, Hindi, or Hinglish:
   > *"200 by 230 pixel karo, 50 KB se kam, JPG format mein"*
2. **Deterministic Natural Language Parser**: FormFit understands mixed numbers, units (px, cm, mm, KB, MB), formats, orientation, background whitening, and signature cleaning with zero API latency and zero cloud dependence.
3. **Smart In-Browser Pipeline**: Resizes with high-quality step-down interpolation, performs binary-search JPEG quality optimization targeting a 97% safety margin, verifies the output with real `createImageBitmap` decoding, and provides an instant Before/After comparison.
4. **100% Private**: All processing runs in HTML5 Canvas on your device. Zero servers, zero uploads, zero tracking.

---

## 🚀 Key Features & Standouts

### 🎙️ 1. Voice-First Command Bar with Auto-Run
- **Wispr Flow integration**: Speak naturally in English, Hindi, or Hinglish. A 0.8-second dictation pause detector automatically runs the command once Wispr Flow finishes transcribing.
- **Editable "I understood" Chips**: Parsed intents render as interactive chips (`200×230 px`, `≤ 50 KB`, `JPEG`). Chips act as the single source of truth—click any chip to edit numerical values or click `✕` to remove an operation.

### 📐 2. Real-World Units & Safety Margin Compression
- **Universal Unit Support**: Handles `px`, `cm`, and `mm` (at customizable DPI, default 300 DPI).
- **Binary Search Encoder**: Dynamically calculates the optimal JPEG quality factor (1–100) to meet target KB limits, applying a `0.97` safety margin so form servers never reject an image on rounding edge-cases.
- **Strict Post-Encode Verification**: Re-decodes the generated Blob through browser image decoders to measure exact final byte size and dimensions before reporting compliance.

### 📋 3. Standout S1: "Paste Form Notice" Rule Extractor
- Copy-paste or dictate a block of text directly from any official exam notification PDF.
- A deterministic multi-slot extractor parses rules for **Photo**, **Signature**, and **Thumb Impression** (dimensions, file size ranges, formats) in one click with a clear honesty disclaimer.

### 🗂️ 4. Standout S2: Multi-Slot Workspace & Client-Side ZIP
- Manage **Photo**, **Signature**, and **Thumb** slots simultaneously in a single session.
- Multi-file drag-and-drop auto-assigns files to available slots.
- **1-Click ZIP Download**: Bundles all ready assets into a clean `.zip` archive entirely in-memory using `fflate`.

### ✨ 5. Standout S3: Signature Cleaner
- Scanned or phone-photographed signatures often have gray shadows, paper creases, or uneven lighting.
- The Signature Cleaner calculates pixel luminance, pushes paper background above the threshold to pure white (`#FFFFFF`), and darkens ink strokes for crisp, high-contrast signatures. Includes an interactive live threshold slider (80–240).

### ✂️ 6. Standout S5: Aspect-Locked Manual Crop Box
- Interactive draggable and resizable crop rectangle directly over the canvas.
- Automatically locks aspect ratio to the target slot dimensions (`widthPx / heightPx`) with a toggle for freeform cropping. Fully integrated into the undo/redo history stack.

### 🏷️ 7. Standout S6: Name & Date Strip Under Photo
- Many Indian forms require a white strip at the bottom of the photo displaying the candidate's name and photograph date.
- Renders a clean white bottom banner (~14% height) with crisp, centered system typography, editable via voice (`"naam Rahul date 26/01/2026 strip dalo"`) or interactive chip fields.

### 🔖 8. Standout S4: Editable Presets & Safe localStorage
- Shipped with default example presets (Standard Photo, Standard Signature, Metric Photo).
- Save active rules as custom presets with zero-crash safe `localStorage` wrapper handling private browsing and quota restrictions gracefully.

---

## 🧪 Verified Test Suite & Real Metrics

FormFit is built with a strict **test-driven quality standard**. All tests run locally via Vitest with zero external dependencies:

```bash
npx vitest run
```

```text
 ✓ tests/notice.test.ts (17 tests)
 ✓ tests/units.test.ts (18 tests)
 ✓ src/tests/commandParser.test.ts (1 test)
 ✓ tests/zip.test.ts (1 test)
 ✓ src/tests/encode.test.ts (7 tests)
 ✓ src/tests/imageProcessor.test.ts (1 test)
 ✓ src/tests/ops.test.ts (8 tests)
 ✓ tests/day6.test.ts (12 tests)
 ✓ tests/parser.test.ts (124 tests)

✅ Parser corpus: Passed 102 / 102 commands (100% accuracy)

Test Files  9 passed (9)
Tests       189 passed (189)
```

### Test Suite Breakdown:
- **Spoken Command Parser Accuracy:** **102 / 102 commands passed (100% accuracy)** across English, Hindi, and Hinglish dictation variations.
- **Notice Rule Extraction:** **17 test cases** verifying complex exam notice text patterns (multilingual numerals, hyphenated ranges, Hindi `से`, format extraction).
- **Units & Safety Margins:** **18 test cases** verifying `cmToPx`, `mmToCm`, 1024 vs 1000 KB base calculations, and 97% safety margin constraints.
- **Signature Cleaner & Name/Date:** **12 test cases** validating luminance threshold math, ink darkening, candidate name capitalization, and localStorage error-safety.
- **Encoder & Quality Search:** **7 test cases** testing binary search convergence, impossible target detection, and quality fallback behavior.

---

## 🎙️ How Wispr Flow Was Used

Wispr Flow was utilized throughout the creation and operation of FormFit:

1. **Building FormFit with Wispr Flow**:
   - Dictated full architecture specifications, feature plans, and edge-case requirements directly into markdown docs.
   - Dictated iterative agent prompts and code refinement requests without touching the keyboard.
   - Dictated test corpus commands, README documentation, and git commit summaries.

2. **Operating FormFit with Wispr Flow**:
   - The user opens FormFit, clicks the command bar, holds down the Wispr Flow hotkey, and speaks naturally in English or Hinglish:
     - *"Photo ko 200 by 230 pixel kar do aur size 50 KB ke andar"*
     - *"Signature clean karo aur ink dark karo"*
     - *"Passport ratio me crop karo"*
     - *"Bottom me candidate name Vikram aur date lagao"*
   - Wispr Flow types the cleaned text directly into the command bar; FormFit detects the 0.8s pause and triggers the pipeline automatically.

---

## 🔒 Privacy & Security Architecture

FormFit is engineered from the ground up to guarantee **zero data exfiltration**:

- **Zero Network Calls After Load**: No remote fonts, no third-party CDN scripts, no tracking telemetry, and no analytics cookies.
- **Production CSP (`vercel.json`)**:
  ```json
  "Content-Security-Policy": "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'"
  ```
  The strict `connect-src 'none'` policy makes it impossible for the browser to transmit network requests (fetch, XHR, WebSocket, or Beacon) even if malicious code were injected.
- **Memory Safety**: Every `URL.createObjectURL` is explicitly revoked on unmount/update, and every `ImageBitmap` instance is safely closed via `bitmap.close()` to prevent memory pressure on mobile browsers.
- **Zero-Crash Policy**: Protected by an error boundary (`ErrorBoundary.tsx`), defensive safe `localStorage` fallbacks, and automatic downscaling for massive images (> 4000 px / 16 MP).

---

## 💻 Local Development Setup

To run FormFit locally on your machine:

```bash
# 1. Clone the repository
git clone https://github.com/Karanbyte07/formfit.git
cd formfit

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run full test suite (189 tests)
npx vitest run

# 5. Build production bundle
npm run build
```

---

## 📄 License

Distributed under the **MIT License**. Free and open-source for students, applicants, and developers.
