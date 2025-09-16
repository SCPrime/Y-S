# Profit Split Simulator

This project provides a React implementation of the "Interactive Profit Split — Founders (Yoni+Spence), Laura, Damon" calculator.
It was ported from the original static HTML prototype into a modern Vite + React application so that the tool can be maintained and
easily extended.

## Features

- Adjust the overall profit and carry percentages to instantly see how the split changes for Founders, Laura, and Damon.
- Toggle between the two deployment scenarios that change the capital-day weights used in the calculations.
- Visualize the distribution with individual bars for each party and a stacked bar representing the total profit.
- Export the current scenario to a CSV file for quick sharing or further analysis.
- Capture investor-class snapshots (entry, management, moonbag) directly from the calculator tab and see how those weights drive Founders, Laura, and Damon dollar allocations.
- Switch to the **AI query & OCR hub** to upload Figment screenshots, auto-populate wallet/PnL/trade fields with on-device OCR, and generate AI-authored executive summaries.

## AI query & OCR hub

1. Navigate to the "AI query & OCR hub" tab and upload a Figment trading screenshot (PNG/JPG/GIF). OCR is processed entirely in the browser via `tesseract.js`.
2. Review and adjust the extracted metrics (wallet size, realized/unrealized PnL, trade counts, carry, snapshot date). Adjust the entry, management, and moonbag weights to drive the advanced allocation cards—these fields stay in sync with the calculator tab’s investor-class panel.
3. Provide an API key for any OpenAI-compatible endpoint (for example, the official OpenAI API or a self-hosted compatible gateway), optionally tweaking the base URL, model, and temperature.
4. Click **Generate executive report** to request a ChatGPT-style briefing that summarises the metrics, compares allocations, and suggests next steps. The generated text stays within the current browser session.

> **Note:** No network request is made until you provide an API key and press the generate button. Keys are not persisted or transmitted anywhere except to the configured AI endpoint.

## Getting started

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:5173](http://localhost:5173) by default.

### Additional scripts

```bash
npm run build   # Build the production bundle
npm run lint    # Run ESLint against the project
```

## Original prototype

The original standalone HTML mockup is preserved in [`docs/original.html`](docs/original.html) for reference.
