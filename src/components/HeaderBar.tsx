import "./HeaderBar.css";

interface HeaderBarProps {
  scenario: string;
  scenarios: string[];
}

export function HeaderBar({ scenario, scenarios }: HeaderBarProps) {
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
        <label>
          Scenario
          <select value={scenario} onChange={() => undefined}>
            {scenarios.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="lc-header__buttons">
          <button type="button">⏯ Play/Pause</button>
          <button type="button">⏩ Speed x1</button>
          <button type="button">💾 Save</button>
          <button type="button">📁 Load</button>
        </div>
      </div>
    </header>
  );
}
