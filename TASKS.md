# LocalCharge Tasks

## Phase 0 – Planning & Setup
1. **Confirm Tech Stack** (React + Vite + TypeScript, Zustand, Tailwind, Recharts)
2. **Wireframes** – sketch layout (charger panel, EMS panel, loads, logs, charts)
3. **Data Model Definition** – describe TS interfaces (ChargingSession, Load, OcppMessage, MeterReading)
4. **GitHub Pages Deployment** – add CI workflow (GitHub Actions) to build and publish the static site automatically

## Phase 1 – Simulation Core
1. **Message Bus** – simple pub/sub for internal events
2. **Charging Station Simulator**
   - State machine (Idle → Preparing → Charging → Finished/Fault)
   - Generates MeterValues, StatusNotifications
3. **EMS (OCPP Central System)**
   - Handles Authorize, Start/StopTransaction, ChangeConfiguration, SetChargingProfile
   - Config for site limit + strategy (throttle vs block)
4. **Load Manager & Meter**
   - Aggregate EV load + external loads
   - Produce Modbus-style register data

## Phase 2 – Multi-Charger Support
1. **Simulation: Multi-Station** – refactor state store so multiple chargers can run simultaneously (individual sessions, SOC, throttling)
2. **UI: Charger Grid** – allow adding/removing stations, per-station panels with live controls
3. **EMS Awareness** – show how total EV load vs site limit is distributed between chargers (stacked view + per-port throttling info)

## Phase 3 – Protocol Visibility & Scenarios
1. **Full OCPP Transcript** – log every request/response with payloads (JSON tree viewer + filters)
2. **Scenario Presets** – JSON definitions (e.g., “Single EV”, “Peak Afternoon”) that can spawn multiple chargers
3. **Save/Load** – export/import scenarios (localStorage + file download)
4. **Time Controls** – play/pause simulation, adjustable speed (1x/2x)

## Phase 4 – Polish & Testing
1. **Guided Tour / Help Tooltips**
2. **Responsive Layout** – adapt for large monitors + tablets
3. **Unit Tests** – state machines, load manager logic (single + multi charger)
4. **Integration Tests** – start/stop flows, scenario loading, OCPP logging
5. **Docs** – update SPEC/CONSTITUTION, add user guide in `/docs`

---
Each task should be tracked via GitHub Issues/Project board. Commit naming: `feat:`, `chore:`, `fix:` etc., referencing issue numbers once created.
