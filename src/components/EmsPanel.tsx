import type { ChargerStation, EmsConfig } from "../types";
import "./Panel.css";

interface EmsPanelProps {
  config: EmsConfig;
  stations: ChargerStation[];
  onSiteLimitChange: (value: number) => void;
}

export function EmsPanel({ config, stations, onSiteLimitChange }: EmsPanelProps) {
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
          <input
            type="range"
            min={30}
            max={180}
            value={config.siteLimitKw}
            onChange={(event) => onSiteLimitChange(Number(event.target.value))}
          />
          <small className="lc-panel__muted">Drag to tweak the site limit in real time.</small>
        </div>

        <div className="lc-panel__group">
          <strong>Per-Charger Allocation</strong>
          <ul className="lc-ems__distribution">
            {stations.map((station) => (
              <li key={station.id}>
                <div>
                  <strong>{station.name}</strong>
                  <small>{station.session.state}</small>
                </div>
                <span>
                  {station.session.actualKw.toFixed(1)} / {station.session.targetKw.toFixed(1)} kW
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lc-panel__group">
          <strong>Active Commands</strong>
          {config.activeCommands.length === 0 ? (
            <small className="lc-panel__muted">No throttling active</small>
          ) : (
            <ul className="lc-list">
              {config.activeCommands.map((cmd) => (
                <li key={cmd}>{cmd}</li>
              ))}
            </ul>
          )}
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
