# Profit Split Calculator

The Profit Split calculator provides an interactive way to model how profits are shared between the founders, Laura, and Damon based on capital-day weights and carry percentages. Adjust the total profit, tweak the carry percentage applied to Laura and Damon, and flip between deployment scenarios to see the impact on each party in real time. The interface also lets you refresh the calculation and export the current split as a CSV snapshot.

## Setup

From the project root run the usual Node tooling commands:

1. Install dependencies with `npm install`.
2. Start a local development server with `npm run dev`.
3. Produce an optimized production bundle with `npm run build`.

## Key components

- `Controls` – Collects user input for profit, carry, and scenario selection, and exposes actions such as recalculating the split or downloading the results.
- `Bars` – Renders the horizontal bar visualizations that compare each participant's share, updating widths and labels as the inputs change.
- `StackedTotals` – Aggregates the individual results into a single stacked bar so you can inspect the overall distribution at a glance.
