import type { EmsConfig } from "../types";
import "./Panel.css";

interface EmsPanelProps {
  config: EmsConfig;
}

export function EmsPanel({ config }: EmsPanelProps) {
  return (
    <section className="lc-panel">
      <header>
        <div>
          <h2>Energy Management</h2>
          <p className="lc-panel__muted">OCPP central system</p>
        </div>
        <span className="lc-chip">strategy: {config.strategy}</span>
      </header>

      <div className="lc-panel__content">
        <div className="lc-panel__group">
          <strong>Site Limit</strong>
          <div className="lc-stat">
            <span>Total</span>
            <strong>{config.siteLimitKw} kW</strong>
          </div>
          <input type="range" min={10} max={200} value={config.siteLimitKw} readOnly />
          <small className="lc-panel__muted">
            Adjust limit to see EMS reaction (coming soon)
          </small>
        </div>

        <div className="lc-panel__group">
          <strong>Active Commands</strong>
          <ul className="lc-list">
            {config.activeCommands.map((cmd) => (
              <li key={cmd}>{cmd}</li>
            ))}
          </ul>
        </div>

        <div className="lc-panel__group">
          <strong>Decision Log</strong>
          <ul className="lc-loglist">
            {config.decisionLog.map((entry) => (
              <li key={entry.timestamp}>
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <p>{entry.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
