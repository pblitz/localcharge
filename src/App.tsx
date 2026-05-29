import { useMemo } from "react";
import "./App.css";
import { HeaderBar } from "./components/HeaderBar";
import { ChargerPanel } from "./components/ChargerPanel";
import { EmsPanel } from "./components/EmsPanel";
import { LoadsPanel } from "./components/LoadsPanel";
import { MeterPanel } from "./components/MeterPanel";
import { LogConsole } from "./components/LogConsole";
import { useSimulationStore } from "./store/simulation";
import { scenarios } from "./data/scenarios";
import type { SavedScenarioPayload } from "./types";

function App() {
  const {
    scenarioId,
    scenarioDescription,
    stations,
    loads,
    ems,
    meter,
    logs,
    isRunning,
    timeScale,
    selectScenario,
    startCharging,
    pauseCharging,
    stopCharging,
    addStation,
    removeStation,
    setLoadPower,
    setSiteLimit,
    toggleRunState,
    setTimeScale,
    exportScenario,
    importScenario,
  } = useSimulationStore((state) => state);

  const scenarioOptions = useMemo(() => {
    const base = scenarios.map((item) => ({ id: item.id, name: item.name }));
    if (scenarioId === "custom" && !base.find((option) => option.id === "custom")) {
      base.push({ id: "custom", name: "Custom" });
    }
    return base;
  }, [scenarioId]);

  const handleSpeedToggle = () => {
    const next = timeScale >= 2 ? 1 : timeScale + 1;
    setTimeScale(next);
  };

  const handleSaveScenario = () => {
    const payload = exportScenario();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payload.title || "scenario"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadScenario = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as SavedScenarioPayload;
        importScenario(parsed);
      } catch (error) {
        console.error("Failed to import scenario", error);
        alert("Konnte Datei nicht laden – bitte gültige JSON-Simulation wählen.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="lc-app">
      <HeaderBar
        scenarioId={scenarioId}
        scenarioDescription={scenarioDescription}
        scenarios={scenarioOptions}
        onScenarioChange={selectScenario}
        isRunning={isRunning}
        timeScale={timeScale}
        onToggleRun={toggleRunState}
        onSpeedToggle={handleSpeedToggle}
        onSaveScenario={handleSaveScenario}
        onLoadScenario={handleLoadScenario}
      />

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
