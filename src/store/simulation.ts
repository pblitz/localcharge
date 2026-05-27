import { nanoid } from "nanoid";
import { create } from "zustand";
import { createMessageBus } from "../sim/bus";
import type {
  ChargerStation,
  ChargingSession,
  EmsConfig,
  Load,
  MeterReading,
  ProtocolLogEntry,
} from "../types";

interface SimulationState {
  stations: ChargerStation[];
  loads: Load[];
  ems: EmsConfig;
  meter: MeterReading;
  logs: ProtocolLogEntry[];
  startCharging: (stationId: string) => void;
  pauseCharging: (stationId: string) => void;
  stopCharging: (stationId: string) => void;
  addStation: () => void;
  removeStation: (stationId: string) => void;
  setLoadPower: (id: string, powerKw: number) => void;
  setSiteLimit: (limit: number) => void;
}

const BATTERY_KWH = 70;
const TICK_MS = 1000;
const MAX_LOGS = 300;
const HISTORY_POINTS = 120;

const bus = createMessageBus();
let ticker: ReturnType<typeof setInterval> | null = null;
let stationCounter = 1;

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

function createSession(targetKw = 22, soc = 30): ChargingSession {
  return {
    id: nanoid(6),
    startedAt: Date.now(),
    targetKw,
    requestedDurationMin: 45,
    deliveredKwh: 0,
    vehicleSocStart: soc,
    vehicleSocTarget: 80,
    vehicleSocCurrent: soc,
    actualKw: 0,
    state: "idle",
  };
}

function nextStationName() {
  return `Charger ${stationCounter++}`;
}

function createStation(name?: string, targetKw?: number, soc?: number): ChargerStation {
  return {
    id: nanoid(4).toUpperCase(),
    name: name ?? nextStationName(),
    session: createSession(targetKw, soc),
  };
}

const baseStations: ChargerStation[] = [
  createStation("Charger 1", 22, 30),
  createStation("Charger 2", 11, 50),
];
stationCounter = baseStations.length + 1;

const baseFacilityKw = baseLoads.reduce((sum, load) => sum + load.powerKw, 0);

const baseMeter: MeterReading = {
  timestamp: Date.now(),
  totalKw: baseFacilityKw,
  limitKw: baseEms.siteLimitKw,
  history: Array.from({ length: HISTORY_POINTS }, () => baseFacilityKw),
  evKw: 0,
  facilityKw: baseFacilityKw,
  perStationKw: baseStations.map((station) => ({ id: station.id, name: station.name, kw: 0 })),
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
  const facilityKw = state.loads.reduce((sum, load) => sum + load.powerKw, 0);
  const availableForChargers = Math.max(state.ems.siteLimitKw - facilityKw, 0);
  const chargingStations = state.stations.filter((station) => station.session.state === "charging");
  const totalDemand = chargingStations.reduce((sum, station) => sum + station.session.targetKw, 0);
  const scaling = totalDemand > 0 ? Math.min(1, availableForChargers / totalDemand) : 0;

  const wasThrottling = state.ems.activeCommands.length > 0;

  let ems = state.ems;
  const updatedStations = state.stations.map((station) => {
    let session = station.session;

    if (session.state === "charging") {
      const actualKwRaw = session.targetKw * (scaling || (availableForChargers > 0 ? 1 : 0));
      const actualKw = Number(actualKwRaw.toFixed(2));

      if (Math.abs(actualKw - session.actualKw) > 0.2) {
        bus.publish("log", {
          id: nanoid(),
          timestamp: Date.now(),
          channel: "OCPP",
          direction: "csms->cp",
          message: `SetChargingProfile → ${actualKw.toFixed(1)} kW`,
          payload: { availableForChargers, totalDemand },
          stationId: station.id,
          stationName: station.name,
        });
      }

      const deliveredKwh = session.deliveredKwh + actualKw * dtHours;
      const energyNeeded = ((session.vehicleSocTarget - session.vehicleSocStart) / 100) * BATTERY_KWH || 1;
      const socProgress = Math.min(
        session.vehicleSocStart + (deliveredKwh / energyNeeded) * (session.vehicleSocTarget - session.vehicleSocStart),
        session.vehicleSocTarget,
      );

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
          stationId: station.id,
          stationName: station.name,
        });
      }
    } else if (session.actualKw !== 0) {
      session = { ...session, actualKw: 0 };
    }

    return { ...station, session };
  });

  const evKw = updatedStations.reduce((sum, station) => sum + station.session.actualKw, 0);
  const totalKw = facilityKw + evKw;

  const throttledStations = updatedStations.filter(
    (station) => station.session.state === "charging" && station.session.actualKw + 0.2 < station.session.targetKw,
  );
  const isThrottling = throttledStations.length > 0;
  const updatedCommands = throttledStations.map(
    (station) => `${station.name}: ${station.session.actualKw.toFixed(1)} / ${station.session.targetKw.toFixed(1)} kW`,
  );

  const decisionLog = isThrottling !== wasThrottling
    ? [
        {
          timestamp: Date.now(),
          message: isThrottling
            ? "Site limit reached – throttling chargers"
            : "Throttle cleared – full power restored",
        },
        ...state.ems.decisionLog,
      ].slice(0, 6)
    : state.ems.decisionLog;

  ems = {
    ...ems,
    activeCommands: updatedCommands,
    decisionLog,
  };

  const meter: MeterReading = {
    timestamp: Date.now(),
    totalKw,
    limitKw: ems.siteLimitKw,
    history: [...state.meter.history.slice(-(HISTORY_POINTS - 1)), totalKw],
    evKw,
    facilityKw,
    perStationKw: updatedStations.map((station) => ({
      id: station.id,
      name: station.name,
      kw: station.session.actualKw,
    })),
  };

  bus.publish("meter", meter);

  setState({ stations: updatedStations, meter, ems });
}

export const useSimulationStore = create<SimulationState>()((set, get) => {
  bus.subscribe("log", (entry) => {
    set((state) => ({ logs: [entry, ...state.logs].slice(0, MAX_LOGS) }));
  });

  ensureTicker(get, (partial) => set(() => partial));

  return {
    stations: baseStations,
    loads: baseLoads,
    ems: baseEms,
    meter: baseMeter,
    logs: [],
    startCharging: (stationId) => {
      const now = Date.now();
      set((state) => {
        const stations = state.stations.map((station) => {
          if (station.id !== stationId) return station;
          if (station.session.state === "charging") return station;
          const session: ChargingSession = {
            ...station.session,
            id: nanoid(6),
            startedAt: now,
            endedAt: undefined,
            deliveredKwh: 0,
            vehicleSocStart: station.session.vehicleSocCurrent,
            state: "preparing",
          };
          bus.publish("log", {
            id: nanoid(),
            timestamp: now,
            channel: "OCPP",
            direction: "cp->csms",
            message: "Authorize",
            stationId: station.id,
            stationName: station.name,
            payload: { targetKw: session.targetKw },
          });
          const updatedStation: ChargerStation = { ...station, session: { ...session, state: "charging" } };
          return updatedStation;
        });
        return { stations };
      });
    },
    pauseCharging: (stationId) => {
      set((state) => {
        const stations = state.stations.map((station) => {
          if (station.id !== stationId) return station;
          if (station.session.state !== "charging") return station;
          bus.publish("log", {
            id: nanoid(),
            timestamp: Date.now(),
            channel: "OCPP",
            direction: "cp->csms",
            message: "RemoteStopRequest",
            stationId: station.id,
            stationName: station.name,
          });
          const updated: ChargingSession = { ...station.session, state: "pausing", actualKw: 0 };
          const updatedStation: ChargerStation = { ...station, session: updated };
          return updatedStation;
        });
        return { stations };
      });
    },
    stopCharging: (stationId) => {
      set((state) => {
        const stations = state.stations.map((station) => {
          if (station.id !== stationId) return station;
          if (station.session.state === "idle") return station;
          const session: ChargingSession = {
            ...station.session,
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
            stationId: station.id,
            stationName: station.name,
          });
          const updatedStation: ChargerStation = { ...station, session };
          return updatedStation;
        });
        return { stations };
      });
    },
    addStation: () => {
      set((state) => {
        const station = createStation();
        bus.publish("log", {
          id: nanoid(),
          timestamp: Date.now(),
          channel: "System",
          direction: "cp->csms",
          message: `${station.name} added to the site`,
          stationId: station.id,
          stationName: station.name,
        });
        const meter: MeterReading = {
          ...state.meter,
          perStationKw: [...state.meter.perStationKw, { id: station.id, name: station.name, kw: 0 }],
        };
        return { stations: [...state.stations, station], meter };
      });
    },
    removeStation: (stationId) => {
      set((state) => {
        if (state.stations.length <= 1) return state;
        const station = state.stations.find((item) => item.id === stationId);
        if (!station) return state;
        bus.publish("log", {
          id: nanoid(),
          timestamp: Date.now(),
          channel: "System",
          direction: "cp->csms",
          message: `${station.name} removed from the site`,
          stationId,
          stationName: station.name,
        });
        const stations = state.stations.filter((item) => item.id !== stationId);
        const meter: MeterReading = {
          ...state.meter,
          perStationKw: state.meter.perStationKw.filter((entry) => entry.id !== stationId),
        };
        return { stations, meter };
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
