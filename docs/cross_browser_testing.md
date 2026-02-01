# Cross-Browser Visualization Checks

## Tooling
Playwright is configured to run smoke tests in Chromium, Firefox, and WebKit.

```
cd frontend
npm run test:e2e
```

## What the smoke test covers
- App loads and renders the main layout.
- Circuit state is injected to enable the simulation button.
- Simulation run triggers measurement results rendering.
- Measurement visualizations (probability histogram) appear in the Results tab.

## Notes
- The test uses a mocked backend response for deterministic visuals.
- See `frontend/e2e/measurement.smoke.spec.ts`.
