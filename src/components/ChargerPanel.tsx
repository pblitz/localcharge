import type { ChargingSession } from "../types";
import "./Panel.css";

interface ChargerPanelProps {
  session: ChargingSession;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function ChargerPanel({ session, onStart, onPause, onStop }: ChargerPanelProps) {
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
            <span>Actual power</span>
            <strong>{session.actualKw.toFixed(1)} kW</strong>
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
            {session.vehicleSocStart}% → <span>{session.vehicleSocCurrent}%</span> → {session.vehicleSocTarget}%
          </div>
        </div>
      </div>

      <footer className="lc-panel__footer">
        <button type="button" onClick={onStart} disabled={session.state === "charging"}>
          Start
        </button>
        <button
          type="button"
          onClick={onPause}
          disabled={session.state !== "charging"}
        >
          Pause
        </button>
        <button type="button" onClick={onStop} disabled={session.state === "idle"}>
          Stop
        </button>
      </footer>
    </section>
  );
}
