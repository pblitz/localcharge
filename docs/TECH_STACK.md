# Tech Stack Decision

LocalCharge will use the following technologies:

| Layer | Choice | Notes |
| --- | --- | --- |
| UI Framework | **React 18 + Vite** | Fast dev server, easy static export. Vite config will later set `base` for GitHub Pages. |
| Language | **TypeScript** | Shared types between simulation engine and UI. |
| State Management | **Zustand** | Lightweight store, great for simulation data + devtools. |
| Styling | **Tailwind CSS + Radix UI primitives** | Rapid layout + accessible components (sliders, dialogs). |
| Charts | **Recharts** | Declarative charts for load curves, easy stacked areas. |
| Simulation Logic | Plain TS modules (no external engines) | Message bus + state machines implemented manually for transparency. |
| Build/Test | **Vite build**, **Vitest**, **Playwright** | Unit + integration tests. |
| Deployment | **GitHub Pages** via workflow | Static site deployed on pushes to `master`. |

This selection keeps the bundle lightweight, enforces type safety, and aligns with the "browser-only" requirement.
