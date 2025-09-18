# Agents playbook for Y‑S

**Purpose.** Define how AI coding agents should work in this repo: where logic lives, what to change, and acceptance checks.

## Global rules

- **Source of truth modules (do not re‑implement in components):**
  - OCR preprocessing & OCR text: `src/lib/ocr.js`
  - OCR metrics parsing (wallet, realized/unrealized PnL, trades, date): `src/lib/figmentParser.js`
  - Weights & capital‑day ledger: `src/lib/weights.js`
  - Allocation (realized PnL, carry, moonbag routing): `src/lib/alloc.js`
  - Fees (entry, mgmt): `src/lib/fees.js`
- Components **import** from the libs above; no inline duplication.
- Tests live under `tests/` (Node’s `node --test`). Add unit tests when changing parsers or math.
- CI: PRs must build & test; **deploy only on `main`** via `.github/workflows/deploy.yml`.
- Vite config: keep `base: '/Y-S/'`. Router should use `basename="/Y-S"` or `HashRouter`.
- Keep changes **scoped**; avoid formatting-only churn in unrelated files.

## Agents

### 1) OCR Agent
**Owns:** `src/lib/ocr.js`, `src/lib/figmentParser.js`, `tests/ocr-parsing.test.js`  
**Principles:**
- Preprocess images (grayscale → invert-if-dark → threshold).
- Tesseract params: whitelist digits/punct, PSM 6, DPI ~300.
- Parser tolerant to `$1,234.56`, `1.2k`, `MM/DD/YYYY` & `YYYY-MM-DD` (normalize to ISO).
**Acceptance:** drop-in screenshot → fills wallet/realized/unrealized/total trades/win trades/date; tests pass.

### 2) Weights Agent
**Owns:** `src/lib/weights.js`  
**Principles:** Class weights normalized (founder/investor/moonbag); investor sub-weights by **capital × days**.

### 3) Allocation Agent
**Owns:** `src/lib/alloc.js`  
**Principles:** Use **realized PnL**, apply **carry** to profit, route moonbag to Founders when Damon not deployed, split investor pool by capital‑day weights.

### 4) Fees Agent
**Owns:** `src/lib/fees.js`  
**Principles:** Entry fee (flat + pct), optional mgmt (pro‑rata by days). Return fee breakdown.

### 5) UI Agent
**Owns:** Components only  
**Principles:** Import from libs; keep UI stateful, logic stateless; persist inputs; export JSON/CSV; do not paste math/parsers into components.

### 6) CI Agent
**Owns:** `.github/workflows/deploy.yml`  
**Principles:** PRs: build/test only. `main`: deploy. Run `npm run lint --if-present`, `npm test --if-present`, `npm run build`.

### 7) Docs Agent
**Owns:** `README.md`, this `AGENTS.md`  
**Principles:** Keep quickstart current; link to live Pages; describe BYOK panel and privacy.

## PR checklist (all agents)

