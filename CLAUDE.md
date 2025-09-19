# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Vite development server (runs on http://localhost:5173)
- `npm run build` - Build production bundle for deployment
- `npm run lint` - Run ESLint against the project
- `npm test` - Run tests using vitest (alias: `vitest run`)

## Architecture Overview

This is a React + Vite application implementing a profit split simulator with OCR capabilities. The architecture follows a strict separation between business logic and UI components.

### Core Library Modules (`src/lib/`)

All business logic is centralized in these source-of-truth modules:

- **`ocr.js`** - OCR preprocessing, text extraction, and metrics parsing from Figment screenshots
- **`figmentParser.js`** - Re-exports parsing functions from `ocr.js` (compatibility layer)
- **`ai.js`** - OpenAI-compatible API integration for generating executive reports
- **`fees.js`** - Fee calculations (entry fees, management fees)

### Component Architecture

- **`App.jsx`** - Main application component with dual functionality:
  - Profit split calculator with scenario toggles (deployed/not deployed)
  - AI query & OCR hub for processing trading screenshots
- Components import from `src/lib/` modules - never duplicate business logic in components

### Testing

- Tests located in `tests/` directory
- Uses vitest framework (`npm test`)
- Example: `tests/ocr-parsing.test.js` for OCR functionality

## Key Development Patterns

### Agent-Based Workflow

This project follows agent-based development principles defined in `AGENTS.md`:

1. **OCR Agent** - Owns OCR processing and Figment parsing
2. **Weights Agent** - Handles class weights and capital-day calculations
3. **Allocation Agent** - Manages profit splits using realized PnL
4. **Fees Agent** - Handles fee calculations
5. **UI Agent** - Components only, imports from libs
6. **CI Agent** - GitHub workflows and deployment
7. **Docs Agent** - Documentation maintenance

### Source of Truth Rule

- Never re-implement business logic in components
- Always import calculations from `src/lib/` modules
- Keep UI stateful, logic stateless

## Deployment Configuration

### GitHub Pages Setup

- **Vite config**: Must maintain `base: '/Y-S/'` for GitHub Pages deployment
- **Router**: Use `basename="/Y-S"` or `HashRouter` for client-side routing
- **CI/CD**: Automated via `.github/workflows/deploy.yml`
  - PRs: build and test only
  - Main branch: build, test, and deploy to Pages

### Build Process

1. Lint check (`npm run lint --if-present`)
2. Test execution (`npm test --if-present`)
3. Production build (`npm run build`)
4. SPA fallback (copies `index.html` to `404.html`)

## Technology Stack

- **Framework**: React 19 + Vite 7
- **OCR**: Tesseract.js (browser-based, no server required)
- **AI**: OpenAI-compatible API endpoints (user-provided keys)
- **Testing**: Vitest
- **Linting**: ESLint with React hooks plugin
- **Deployment**: GitHub Pages

## Development Guidelines

- Follow existing ESLint configuration
- Add unit tests when changing parsers or mathematical calculations
- Keep changes scoped - avoid formatting-only changes in unrelated files
- Test OCR functionality with actual Figment screenshots
- Ensure AI integration respects user privacy (keys not persisted)

## OCR Processing Pipeline

1. Image preprocessing (grayscale → invert-if-dark → threshold)
2. Tesseract extraction with optimized parameters (PSM 6, DPI ~300)
3. Parsing for wallet size, PnL, trade counts, dates
4. Format normalization (handles `$1,234.56`, `1.2k`, date formats)

## Profit Split Logic

- Uses **realized PnL** as basis for calculations
- Applies carry percentage to profits
- Routes moonbag allocation to Founders when Damon not deployed
- Splits investor pool by capital-day weights (Laura: 17,500, Damon: 0 or 5,000)