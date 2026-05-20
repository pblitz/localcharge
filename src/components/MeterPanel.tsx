import type { MeterReading } from "../types";
import "./Panel.css";

interface MeterPanelProps {
  reading: MeterReading;
}

export function MeterPanel({ reading }: MeterPanelProps) {
  const points = reading.history
    .map((value, index) => `${(index / (reading.history.length - 1)) * 100},${100 - value}`)
    .join(" ");

  return (
    <section className="lc-panel">
      <header>
        <div>
          <h2>Power Meter</h2>
          <p className="lc-panel__muted">virtual Modbus registers</p>
        </div>
        <span className="lc-chip">
          {reading.totalKw.toFixed(1)} / {reading.limitKw.toFixed(1)} kW
        </span>
      </header>

      <div className="lc-panel__content">
        <div className="lc-panel__group" style={{ gridColumn: "span 2" }}>
          <strong>Load Timeline</strong>
          <div className="lc-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={points} />
              <line x1="0" y1={100 - reading.limitKw} x2="100" y2={100 - reading.limitKw} />
            </svg>
          </div>
          <small className="lc-panel__muted">
            Placeholder chart – real-time data will drive this soon.
          </small>
        </div>
      </div>
    </section>
  );
}
