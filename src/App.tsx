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
    session,
    loads,
    ems,
    meter,
    logs,
    startCharging,
    pauseCharging,
    stopCharging,
    setLoadPower,
    setSiteLimit,
  } = useSimulationStore((state) => state);

  return (
    <div className="lc-app">
      <HeaderBar scenario="Single EV" scenarios={["Single EV", "Peak Afternoon", "Custom"]} />

      <main className="lc-grid">
        <ChargerPanel
          session={session}
          onStart={startCharging}
          onPause={pauseCharging}
          onStop={stopCharging}
        />
        <EmsPanel config={ems} onSiteLimitChange={setSiteLimit} />
        <LoadsPanel loads={loads} onLoadChange={setLoadPower} />
        <MeterPanel reading={meter} />
      </main>

      <LogConsole entries={logs} />
    </div>
  );
}

export default App;
