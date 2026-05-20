# LocalCharge Constitution

This document defines the architectural and development principles for the LocalCharge project.

## 1. Architectural Principles
1. **Pure Frontend Simulation**
   - All logic runs client-side. No backend services or databases.
   - Communication between simulated components (OCPP, EMS, Modbus, loads) happens via in-memory message bus abstractions.

2. **Modularity & Replaceability**
   - Each simulated component (Charger, EMS, Meter, Load Manager) lives in its own module with clearly defined interfaces.
   - Future adapters can replace modules (e.g., wiring EMS to a real OCPP server) without rewriting the UI.

3. **Transparency by Design**
   - Every simulated message/event should be inspectable in the UI.
   - Provide raw payloads whenever possible so users can learn the protocols.

4. **Scenario-Driven Development**
   - Features should map to realistic scenarios (e.g., “site limit exceeded, throttle EV”).
   - Scenario presets serve as functional tests.

5. **User-Focused UX**
   - Single-page dashboard with intuitive controls and context help.
   - Prioritize clarity of data visualization over fancy graphics.

## 2. Development Guidelines
1. **Tech Stack Discipline**
   - Use TypeScript throughout for static safety.
   - Prefer React + Vite unless a justified alternative is approved.
   - Tailwind CSS for styling; avoid ad-hoc inline styles.

2. **State Management**
   - Central store holds simulation state; UI subscribes via selectors.
   - Use immutable patterns to keep debugging straightforward.

3. **Testing**
   - Unit tests for simulation logic (load manager, EMS decisions, OCPP state machine).
   - Component tests for critical UI elements.
   - Scenario tests (Playwright) for start/stop flows.
   - Every feature branch/task must run a successful local build (`npm run build`) before it is marked done.

4. **Code Quality**
   - ESLint + Prettier enforced via pre-commit hook.
   - Descriptive naming (e.g., `ChargingSession`, `LoadProfile`, `OcppMessage`).
   - Document module APIs (JSDoc) especially for simulation engine.

5. **Documentation**
   - SPECIFICATION.md stays up to date.
   - Maintain `/docs` with module diagrams, data flow, user guide.
   - Provide example scenarios as JSON + explanation.

## 3. Release Philosophy
- **MVP First:** Deliver a functional simulation focused on a single charger scenario.
- **Iterative Enhancements:** Add features (multi-load scheduling, more charts) in small increments.
- **Demo Ready:** Always keep `main` branch in a state that can be demoed via static hosting.

## 4. Governance
- Changes to SPECIFICATION or CONSTITUTION require review + approval (PR with rationale).
- Major architectural shifts (e.g., introducing a backend) need explicit sign-off from project owner.
- Scenario presets should be curated to showcase key behaviors.

---
By adhering to this constitution, LocalCharge remains coherent, transparent, and easy to extend while honoring the “browser-only” mandate.
