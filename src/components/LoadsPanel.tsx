import type { Load } from "../types";
import "./Panel.css";

interface LoadsPanelProps {
  loads: Load[];
  onLoadChange: (id: string, value: number) => void;
}

export function LoadsPanel({ loads, onLoadChange }: LoadsPanelProps) {
  return (
    <section className="lc-panel">
      <header>
        <div>
          <h2>Site Loads</h2>
          <p className="lc-panel__muted">non-EV consumers</p>
        </div>
        <button type="button">＋ Add load</button>
      </header>

      <div className="lc-panel__content">
        {loads.map((load) => (
          <div key={load.id} className="lc-panel__group">
            <div className="lc-stat">
              <strong>{load.name}</strong>
              <span>{load.powerKw.toFixed(1)} kW</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={load.powerKw}
              onChange={(event) => onLoadChange(load.id, Number(event.target.value))}
            />
            <small className="lc-panel__muted">Type: {load.type}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
