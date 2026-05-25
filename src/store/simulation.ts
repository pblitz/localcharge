import { nanoid } from "nanoid";
import { create } from "zustand";
import { createMessageBus } from "../sim/bus";
import type {
  ChargingSession,
  EmsConfig,
  Load,
  MeterReading,
  ProtocolLogEntry,
} from "../types";

interface SimulationState {
  session: ChargingSession;
  loads: Load[];
  ems: EmsConfig;
  meter: MeterReading;
  logs: ProtocolLogEntry[];
  startCharging: () => void;
  pauseCharging: () => void;
  stopCharging: () => void;
  setLoadPower: (id: string, powerKw: number) => void;
  setSiteLimit: (limit: number) => void;
}

const BATTERY_KWH = 70;
const TICK_MS = 1000;
const MAX_LOGS = 200;

const bus = createMessageBus();
let ticker: ReturnType<typeof setInterval> | null = null;

const baseSession: ChargingSession = {
  id: "initial",
  startedAt: Date.now(),
  targetKw: 22,
  requestedDurationMin: 45,
  deliveredKwh: 0,
  vehicleSocStart: 30,
  vehicleSocTarget: 80,
  vehicleSocCurrent: 30,
  actualKw: 0,
  state: "idle",
};

const baseLoads: Load[] = [
  { id: "l1", name: "HVAC", type: "sched", powerKw: 12 },
  { id: "l2", name: "Lighting", type: "static", powerKw: 4.5 },
  { id: "l3", name: "Production", type: "script", powerKw: 26 },
];

const baseEms: EmsConfig = {
  siteLimitKw: 80,
  strategy: "throttle-ev",
  activeCommands: [],
  decisionLog: [],
};

const baseMeter: MeterReading = {
  timestamp: Date.now(),
  totalKw: 42,
  limitKw: baseEms.siteLimitKw,
  history: Array.from({ length: 20 }, () => 42),
};

function ensureTicker(get: () => SimulationState, set: (partial: Partial<SimulationState>) => void) {
  if (typeof window === "undefined" || ticker) return;
  ticker = window.setInterval(() => tickSimulation(get, set), TICK_MS);
}

function tickSimulation(
  getState: () => SimulationState,
  setState: (partial: Partial<SimulationState>) => void,
) {
  const state = getState();
  const dtHours = TICK_MS / 3_600_000;
  const otherLoads = state.loads.reduce((sum, load) => sum + load.powerKw, 0);

  let session = state.session;
  let ems = state.ems;

  if (session.state === "charging") {
    const available = Math.max(ems.siteLimitKw - otherLoads, 0);
    const actualKw = Math.min(session.targetKw, available);
    const deliveredKwh = session.deliveredKwh + actualKw * dtHours;
    const energyNeeded = ((session.vehicleSocTarget - session.vehicleSocStart) / 100) * BATTERY_KWH || 1;
    const socProgress = Math.min(
      session.vehicleSocStart + (deliveredKwh / energyNeeded) * (session.vehicleSocTarget - session.vehicleSocStart),
      session.vehicleSocTarget,
    );

    if (Math.abs(actualKw - session.actualKw) > 0.2) {
      bus.publish("log", {
        id: nanoid(),
        timestamp: Date.now(),
        channel: "OCPP",
        direction: "csms->cp",
        message: `SetChargingProfile → ${actualKw.toFixed(1)} kW`,
        payload: { available },
      });
      ems = {
        ...ems,
        activeCommands: actualKw < session.targetKw ? [`Limit to ${actualKw.toFixed(1)} kW`] : [],
        decisionLog:
          actualKw < session.targetKw
            ? [{ timestamp: Date.now(), message: "Site limit hit, throttling charger" }, ...ems.decisionLog].slice(0, 6)
            : ems.decisionLog,
      };
    }

    session = {
      ...session,
      actualKw,
      deliveredKwh,
      vehicleSocCurrent: Number(socProgress.toFixed(1)),
    };

    const targetEnergy = (session.targetKw * session.requestedDurationMin) / 60;
    const reachedTargetEnergy = deliveredKwh >= targetEnergy;
    const reachedSoc = session.vehicleSocCurrent >= session.vehicleSocTarget - 0.1;
    if (reachedTargetEnergy || reachedSoc) {
      session = {
        ...session,
        state: "finished",
        endedAt: Date.now(),
        actualKw: 0,
      };
      bus.publish("log", {
        id: nanoid(),
        timestamp: Date.now(),
        channel: "OCPP",
        direction: "cp->csms",
        message: "StopTransaction (completed)",
      });
    }
  } else if (session.actualKw !== 0) {
    session = { ...session, actualKw: 0 };
  }

  const totalKw = session.actualKw + otherLoads;
  const history = [...state.meter.history.slice(-59), totalKw];
  const meter: MeterReading = {
    timestamp: Date.now(),
    totalKw,
    limitKw: ems.siteLimitKw,
    history,
  };

  bus.publish("meter", meter);

  setState({ session, meter, ems });
}

export const useSimulationStore = create<SimulationState>()((set, get) => {
  bus.subscribe("log", (entry) => {
    set((state) => ({ logs: [entry, ...state.logs].slice(0, MAX_LOGS) }));
  });

  ensureTicker(get, (partial) => set(() => partial));

  return {
    session: baseSession,
    loads: baseLoads,
    ems: baseEms,
    meter: baseMeter,
    logs: [],
    startCharging: () => {
      const now = Date.now();
      set((state) => {
        if (state.session.state === "charging") return state;
        const session: ChargingSession = {
          ...state.session,
          id: nanoid(6),
          startedAt: now,
          endedAt: undefined,
          deliveredKwh: 0,
          vehicleSocCurrent: state.session.vehicleSocStart,
          actualKw: state.session.targetKw,
          state: "charging",
        };
        bus.publish("log", {
          id: nanoid(),
          timestamp: now,
          channel: "OCPP",
          direction: "cp->csms",
          message: "Authorize / StartTransaction",
          payload: { targetKw: session.targetKw },
        });
        return { session };
      });
    },
    pauseCharging: () => {
      set((state) => {
        if (state.session.state !== "charging") return state;
        bus.publish("log", {
          id: nanoid(),
          timestamp: Date.now(),
          channel: "OCPP",
          direction: "cp->csms",
          message: "RemoteStopRequest",
        });
        const updated: ChargingSession = { ...state.session, state: "pausing", actualKw: 0 };
        return { session: updated };
      });
    },
    stopCharging: () => {
      set((state) => {
        if (state.session.state === "idle") return state;
        const session: ChargingSession = {
          ...state.session,
          state: "finished",
          endedAt: Date.now(),
          actualKw: 0,
        };
        bus.publish("log", {
          id: nanoid(),
          timestamp: Date.now(),
          channel: "OCPP",
          direction: "cp->csms",
          message: "StopTransaction",
        });
        return { session };
      });
    },
    setLoadPower: (id, powerKw) => {
      const value = Math.max(0, Math.min(60, powerKw));
      set((state) => ({
        loads: state.loads.map((load) => (load.id === id ? { ...load, powerKw: value } : load)),
      }));
    },
    setSiteLimit: (limit) => {
      set((state) => ({
        ems: { ...state.ems, siteLimitKw: limit },
        meter: { ...state.meter, limitKw: limit },
      }));
    },
  };
});
