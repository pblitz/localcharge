import type { ChargingSession } from "../types";
import "./Panel.css";

interface ChargerPanelProps {
  session: ChargingSession;
}

export function ChargerPanel({ session }: ChargerPanelProps) {
  return (
    <section className="lc-panel">
      <header>
        <div>
          <h2>Charging Station</h2>
          <p className="lc-panel__muted">OCPP client simulator</p>
        </div>
        <span className={`lc-chip state-${session.state}`}>{session.state}</span>
      </header>

      <div className="lc-panel__content">
        <div className="lc-panel__group">
          <strong>Session</strong>
          <div className="lc-stat">
            <span>Target power</span>
            <strong>{session.targetKw.toFixed(1)} kW</strong>
          </div>
          <div className="lc-stat">
            <span>Delivered</span>
            <strong>{session.deliveredKwh.toFixed(2)} kWh</strong>
          </div>
          <div className="lc-stat">
            <span>Duration</span>
            <strong>{session.requestedDurationMin} min</strong>
          </div>
        </div>

        <div className="lc-panel__group">
          <strong>Vehicle SOC</strong>
          <label>
            Start
            <input type="range" value={session.vehicleSocStart} readOnly />
          </label>
          <label>
            Target
            <input type="range" value={session.vehicleSocTarget} readOnly />
          </label>
          <div className="lc-panel__soc">
            {session.vehicleSocStart}% → {session.vehicleSocTarget}%
          </div>
        </div>
      </div>

      <footer className="lc-panel__footer">
        <button type="button">Start</button>
        <button type="button">Pause</button>
        <button type="button">Stop</button>
      </footer>
    </section>
  );
}
