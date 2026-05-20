import type { ProtocolLogEntry } from "../types";
import "./LogConsole.css";

interface LogConsoleProps {
  entries: ProtocolLogEntry[];
}

const filters = ["All", "OCPP", "Modbus", "System"] as const;

export function LogConsole({ entries }: LogConsoleProps) {
  return (
    <section className="lc-log">
      <header>
        <h2>Protocol Console</h2>
        <div>
          {filters.map((filter) => (
            <button key={filter} type="button">
              {filter}
            </button>
          ))}
        </div>
      </header>
      <div className="lc-log__entries">
        {entries.map((entry) => (
          <article key={entry.id}>
            <div className="lc-log__meta">
              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span>{entry.channel}</span>
              <span>{entry.direction}</span>
            </div>
            <p>{entry.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
