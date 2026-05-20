# LocalCharge

Browser-based EV charging simulation lab. LocalCharge runs entirely in the browser and emulates:

- An OCPP charging station
- An energy management system (central system)
- A Modbus power meter
- Configurable site loads

This repository contains the UI shell built with React + Vite. Phase 2 delivers the dashboard layout and placeholder data so we can iterate on the simulation logic next.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start Vite dev server
npm run build    # type-check + production build
npm run preview  # preview the built app
```

## Structure

- `src/components` – UI sections (header, panels, log console)
- `src/types.ts` – shared placeholder types aligned with SPECIFICATION.md
- `docs/` – planning artifacts (tech stack, wireframes, data model)
- `.github/workflows/deploy.yml` – GitHub Pages build & deploy pipeline

## Deployment

The GitHub Actions workflow builds and publishes the static site on every push to `master` once the app is ready. No backend is required.

---
Next steps: implement simulation engine (Phase 1) and wire the UI to live data structures.
