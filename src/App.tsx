import "./App.css";
import { HeaderBar } from "./components/HeaderBar";
import { ChargerPanel } from "./components/ChargerPanel";
import { EmsPanel } from "./components/EmsPanel";
import { LoadsPanel } from "./components/LoadsPanel";
import { MeterPanel } from "./components/MeterPanel";
import { LogConsole } from "./components/LogConsole";
import type { ChargingSession, EmsConfig, Load, MeterReading, ProtocolLogEntry } from "./types";

const sampleSession: ChargingSession = {
  id: "demo",
  startedAt: Date.now() - 5 * 60 * 1000,
  targetKw: 22,
  requestedDurationMin: 45,
  deliveredKwh: 3.4,
  vehicleSocStart: 30,
  vehicleSocTarget: 80,
  state: "charging",
};

const sampleLoads: Load[] = [
  { id: "l1", name: "HVAC", type: "sched", powerKw: 12 },
  { id: "l2", name: "Lighting", type: "static", powerKw: 4.5 },
  { id: "l3", name: "Production line", type: "script", powerKw: 26 },
];

const sampleEms: EmsConfig = {
  siteLimitKw: 80,
  strategy: "throttle-ev",
  activeCommands: ["SetChargingProfile → 18 kW"],
  decisionLog: [
    { timestamp: Date.now() - 30_000, message: "Load spike detected, throttling EV" },
    { timestamp: Date.now() - 90_000, message: "Site limit adjusted to 80 kW" },
  ],
};

const sampleMeter: MeterReading = {
  timestamp: Date.now(),
  totalKw: 65,
  limitKw: 80,
  history: [40, 45, 50, 70, 65, 60, 58, 64, 66, 65],
};

const sampleLogs: ProtocolLogEntry[] = [
  {
    id: "log1",
    timestamp: Date.now() - 1000,
    direction: "cp->csms",
    channel: "OCPP",
    message: "MeterValues [22.5 kW]",
  },
  {
    id: "log2",
    timestamp: Date.now() - 4000,
    direction: "csms->cp",
    channel: "OCPP",
    message: "SetChargingProfile → 18 kW",
  },
  {
    id: "log3",
    timestamp: Date.now() - 6000,
    direction: "modbus",
    channel: "Modbus",
    message: "Read holding register 0x0010 = 64 kW",
  },
];

function App() {
  return (
    <div className="lc-app">
      <HeaderBar scenario="Single EV" scenarios={["Single EV", "Peak afternoon", "Custom"]} />

      <main className="lc-grid">
        <ChargerPanel session={sampleSession} />
        <EmsPanel config={sampleEms} />
        <LoadsPanel loads={sampleLoads} />
        <MeterPanel reading={sampleMeter} />
      </main>

      <LogConsole entries={sampleLogs} />
    </div>
  );
}

export default App;
