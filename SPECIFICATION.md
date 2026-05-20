# LocalCharge Specification

## 1. Overview
LocalCharge is a fully browser-based simulator that emulates a miniature EV charging ecosystem:
- An OCPP-enabled EV charging station
- An Energy Management System (EMS)
- A Modbus-connected power meter
- Additional external loads influencing the site power budget

Users interact through a single-page web app to start charging sessions, tweak EV parameters, add/remove loads, and observe how the EMS balances demand. All logic runs client-side (no backend services), with protocol exchanges visualized as if real devices were communicating.

## 2. Goals
1. Provide an interactive teaching/demonstration tool for OCPP + Modbus-based energy management.
2. Allow users to tweak parameters (power limits, load profiles) and instantly see outcomes.
3. Show detailed inputs/outputs for each simulated component (charging station, EMS, meter, loads).
4. Remain 100% client-side for easy deployment (static hosting) and offline use.

## 3. Core Components
### 3.1 Simulation Engine
- Implements simplified models of:
  - **Charging Station**: OCPP client state machine (Authorize, StartTransaction, MeterValues, StopTransaction, Heartbeat).
  - **EMS (Central System)**: OCPP server reacting to station messages, applying configurable load-management logic.
  - **Power Meter**: Modbus-like device providing total site load readings based on aggregated loads.
  - **External Loads**: User-defined loads with adjustable power draw profiles (static, stepped, or scripted).
- Runs as pure JavaScript modules, communicating via in-memory message bus (no real sockets).
- Supports scenario presets (JSON) and persistence (localStorage/download).

### 3.2 User Interface
- Layout with panels for:
  - Charging station status & controls
  - EMS decisions and configuration
  - Power meter readings + load breakdown
  - Log console showing OCPP/Modbus messages
  - Graphs for power over time
- Real-time updates using reactive framework (e.g., React + Zustand/MobX or Svelte stores).
- Controls for starting/stopping sessions, adjusting EV parameters, adding loads, tweaking site limits.

### 3.3 Data Visualization
- Line charts for total load vs limit; stacked chart for individual contributions.
- Timeline/log view with filters (OCPP only, Modbus only, errors only).
- Tooltips/inspectors showing raw message payloads for enthusiasts.

## 4. Functional Requirements
1. **Charging Session Control**
   - Start/stop session, set target amperage/kW, define session length or auto-stop on battery full.
   - Display session metrics (energy delivered, duration, status).

2. **EMS Load Management**
   - Configure site max power and per-phase limits.
   - Choose load-management strategy (throttle EV vs shed other loads, or mix).
   - Show EMS decisions in real time (e.g., "SetChargingProfile from 32A to 16A").

3. **Modbus Meter Simulation**
   - Display register values (total kW, per-phase current/voltage, etc.).
   - Update values as loads change; allow manual overrides for testing.

4. **External Loads**
   - Add named loads with adjustable power draw.
   - Allow schedule/automation (e.g., turn on at t=5m, ramp down after 10m).

5. **Logging & Diagnostics**
   - Show chronological list of protocol messages (pseudo OCPP frames, Modbus reads/writes).
   - Provide JSON inspector for each log entry.
   - Offer export (download logs as JSON) for analysis.

6. **Scenario Management**
   - Save current configuration + load profile + EMS settings as a scenario.
   - Load scenarios from local files or preset library (e.g., "Peak demand day").

## 5. Non-Functional Requirements
- Runs entirely in modern browsers (Chrome, Edge, Safari, Firefox) without server.
- Modular architecture to allow future upgrade (e.g., hooking to real OCPP server) by swapping interfaces.
- TypeScript for maintainability; bundler (Vite) for dev experience.
- Automated testing via Playwright/Vitest for key flows.

## 6. Tech Stack
- **Framework:** React + Vite + TypeScript (or SvelteKit for smaller footprint—decision pending).
- **State Management:** Zustand or Redux Toolkit (React) / Svelte stores.
- **Charts:** Recharts or D3 (React) / ECharts / Chart.js.
- **Styling:** Tailwind CSS for rapid UI + component library (Radix UI) for controls.
- **Persistence:** localStorage + downloadable JSON.

## 7. Milestones
1. **MVP Simulation Engine (Week 1-2)**
   - Implement charging station + EMS state machines
   - Implement load aggregator + meter outputs
   - Hardcoded UI for verifying logic
2. **UI/UX Foundation (Week 3-4)**
   - Build layout, live metrics, log viewer
   - Connect controls to simulation engine
3. **Advanced Features (Week 5-6)**
   - Scenario save/load, external load scheduler, chart visualizations
   - Logging inspector & export
4. **Polish & Docs (Week 7)**
   - Responsive design, onboarding hints, user guide

## 8. Future Enhancements (Out of Scope for MVP)
- Multi-charger support (multiple OCPP clients)
- DER/PV generation modules
- Pricing/tariff simulation and cost optimization
- Real-time collaboration (multi-user) via backend

---
This SPECIFICATION.md will evolve as design decisions are made (framework choice, UI wireframes, etc.).
