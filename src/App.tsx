import "./App.css";
import { HeaderBar } from "./components/HeaderBar";
import { ChargerPanel } from "./components/ChargerPanel";
import { EmsPanel } from "./components/EmsPanel";
import { LoadsPanel } from "./components/LoadsPanel";
import { MeterPanel } from "./components/MeterPanel";
import { LogConsole } from "./components/LogConsole";
import { useSimulationStore } from "./store/simulation";

function App() {
  const {
    stations,
    loads,
    ems,
    meter,
    logs,
    startCharging,
    pauseCharging,
    stopCharging,
    addStation,
    removeStation,
    setLoadPower,
    setSiteLimit,
  } = useSimulationStore((state) => state);

  return (
    <div className="lc-app">
      <HeaderBar scenario="Single EV" scenarios={["Single EV", "Peak Afternoon", "Custom"]} />

      <main className="lc-grid">
        <section className="lc-grid__full lc-chargers">
          <div className="lc-chargers__header">
            <h2>Charging Stations</h2>
            <button type="button" onClick={addStation}>
              ➕ Add Charger
            </button>
          </div>
          <div className="lc-chargers__grid">
            {stations.map((station) => (
              <ChargerPanel
                key={station.id}
                station={station}
                onStart={() => startCharging(station.id)}
                onPause={() => pauseCharging(station.id)}
                onStop={() => stopCharging(station.id)}
                onRemove={() => removeStation(station.id)}
                canRemove={stations.length > 1}
              />
            ))}
          </div>
        </section>

        <EmsPanel config={ems} stations={stations} onSiteLimitChange={setSiteLimit} />
        <LoadsPanel loads={loads} onLoadChange={setLoadPower} />
        <MeterPanel reading={meter} />
      </main>

      <LogConsole entries={logs} />
    </div>
  );
}

export default App;
