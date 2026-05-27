import type { MeterReading } from "../types";
import "./Panel.css";

interface MeterPanelProps {
  reading: MeterReading;
}

export function MeterPanel({ reading }: MeterPanelProps) {
  const normalized = reading.history.map((value) =>
    reading.limitKw ? Math.min(1, value / reading.limitKw) : 0,
  );
  const points = normalized
    .map((value, index) => `${(index / Math.max(normalized.length - 1, 1)) * 100},${100 - value * 100}`)
    .join(" ");
  const utilization = reading.limitKw ? Math.min(1, reading.totalKw / reading.limitKw) : 0;

  return (
    <section className="lc-panel">
      <header>
        <div>
          <h2>Power Meter</h2>
          <p className="lc-panel__muted">virtual Modbus registers</p>
        </div>
        <span className="lc-chip">
          {(utilization * 100).toFixed(0)}% load
        </span>
      </header>

      <div className="lc-panel__content">
        <div className="lc-panel__group">
          <strong>Site Totals</strong>
          <div className="lc-stat">
            <span>EV chargers</span>
            <strong>{reading.evKw.toFixed(1)} kW</strong>
          </div>
          <div className="lc-stat">
            <span>Facility loads</span>
            <strong>{reading.facilityKw.toFixed(1)} kW</strong>
          </div>
          <div className="lc-stat">
            <span>Total</span>
            <strong>{reading.totalKw.toFixed(1)} / {reading.limitKw.toFixed(1)} kW</strong>
          </div>
        </div>

        <div className="lc-panel__group" style={{ gridColumn: "span 2" }}>
          <strong>Load Timeline</strong>
          <div className="lc-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={points || "0,100"} />
              <line x1="0" y1={0} x2="100" y2={0} />
            </svg>
          </div>
          <small className="lc-panel__muted">
            Showing total site load as a percentage of the site limit.
          </small>
        </div>

        <div className="lc-panel__group" style={{ gridColumn: "span 2" }}>
          <strong>Per-Charger Contribution</strong>
          <ul className="lc-panel__chips">
            {reading.perStationKw.map((station) => (
              <li key={station.id}>
                <span>{station.name}</span>
                <strong>{station.kw.toFixed(1)} kW</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
