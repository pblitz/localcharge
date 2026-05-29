import { useMemo, useState } from "react";
import type { ProtocolLogEntry } from "../types";
import "./LogConsole.css";

interface LogConsoleProps {
  entries: ProtocolLogEntry[];
}

const filters = ["All", "OCPP", "Modbus", "System"] as const;

export function LogConsole({ entries }: LogConsoleProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const filteredEntries = useMemo(
    () => (activeFilter === "All" ? entries : entries.filter((entry) => entry.channel === activeFilter)),
    [entries, activeFilter],
  );

  return (
    <section className="lc-log">
      <header>
        <h2>Protocol Console</h2>
        <div>
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={filter === activeFilter ? "is-active" : undefined}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>
      <div className="lc-log__entries">
        {filteredEntries.length === 0 ? (
          <p className="lc-log__empty">Noch keine Protokolle für diesen Filter.</p>
        ) : (
          filteredEntries.map((entry) => (
            <article key={entry.id}>
              <div className="lc-log__meta">
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span>{entry.channel}</span>
                <span>{entry.direction}</span>
                {entry.stationName && <span className="lc-log__station">{entry.stationName}</span>}
              </div>
              <p>{entry.message}</p>
              {entry.payload && (
                <pre className="lc-log__payload">{JSON.stringify(entry.payload, null, 2)}</pre>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
