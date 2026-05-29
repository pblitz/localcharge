import { useRef } from "react";
import "./HeaderBar.css";

interface ScenarioOption {
  id: string;
  name: string;
}

interface HeaderBarProps {
  scenarioId: string;
  scenarioDescription: string;
  scenarios: ScenarioOption[];
  onScenarioChange: (id: string) => void;
  isRunning: boolean;
  timeScale: number;
  onToggleRun: () => void;
  onSpeedToggle: () => void;
  onSaveScenario: () => void;
  onLoadScenario: (file: File) => void;
}

export function HeaderBar({
  scenarioId,
  scenarioDescription,
  scenarios,
  onScenarioChange,
  isRunning,
  timeScale,
  onToggleRun,
  onSpeedToggle,
  onSaveScenario,
  onLoadScenario,
}: HeaderBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="lc-header">
      <div className="lc-header__brand">
        <span className="lc-header__logo" aria-hidden>
          ⚡
        </span>
        <div>
          <strong>LocalCharge</strong>
          <small>browser-based charging lab</small>
        </div>
      </div>
      <div className="lc-header__controls">
        <label title={scenarioDescription}>
          Scenario
          <select value={scenarioId} onChange={(event) => onScenarioChange(event.target.value)}>
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="lc-header__buttons">
          <button type="button" onClick={onToggleRun}>
            {isRunning ? "⏸ Pause" : "▶️ Play"}
          </button>
          <button type="button" onClick={onSpeedToggle}>
            ⏩ Speed x{timeScale}
          </button>
          <button type="button" onClick={onSaveScenario}>
            💾 Save
          </button>
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            📁 Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onLoadScenario(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </header>
  );
}
