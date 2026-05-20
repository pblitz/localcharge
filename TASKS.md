# LocalCharge Tasks

## Phase 0 – Planning & Setup
1. **Confirm Tech Stack** (React + Vite + TypeScript, Zustand, Tailwind, Recharts)
2. **Wireframes** – sketch layout (charger panel, EMS panel, loads, logs, charts)
3. **Data Model Definition** – describe TS interfaces (ChargingSession, Load, OcppMessage, MeterReading)

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

## Phase 2 – User Interface
1. **App Shell** – header, navigation, main grid layout
2. **Charger Panel** – start/stop controls, EV settings, live status
3. **EMS Panel** – site limit controls, decision log
4. **Loads Panel** – list of loads, add/edit/remove, power sliders
5. **Meter & Charts** – live graphs (total load vs limit, stacked contributions)
6. **Log Console** – filterable view of OCPP + Modbus messages

## Phase 3 – Scenario & Persistence
1. **Scenario Presets** – JSON definitions (e.g., “Single EV”, “Peak Afternoon”)
2. **Save/Load** – export/import scenarios (localStorage + file download)
3. **Time Controls** – play/pause simulation, adjustable speed (1x/2x)

## Phase 4 – Polish & Testing
1. **Guided Tour / Help Tooltips**
2. **Responsive Layout** – adapt for large monitors + tablets
3. **Unit Tests** – state machines, load manager logic
4. **Integration Tests** – start/stop flows, scenario loading
5. **Docs** – update SPEC/CONSTITUTION, add user guide in `/docs`

---
Each task should be tracked via GitHub Issues/Project board. Commit naming: `feat:`, `chore:`, `fix:` etc., referencing issue numbers once created.
