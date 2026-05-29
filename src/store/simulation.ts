import { nanoid } from "nanoid";
import { create } from "zustand";
import { scenarios, getScenarioById } from "../data/scenarios";
import { createMessageBus } from "../sim/bus";
import type {
  ChargerStation,
  ChargingSession,
  EmsConfig,
  Load,
  MeterReading,
  ProtocolLogEntry,
  SavedScenarioPayload,
  ScenarioConfig,
} from "../types";

interface SimulationState {
  scenarioId: string;
  scenarioDescription: string;
  stations: ChargerStation[];
  loads: Load[];
  ems: EmsConfig;
  meter: MeterReading;
  logs: ProtocolLogEntry[];
  isRunning: boolean;
  timeScale: number;
  selectScenario: (id: string) => void;
  startCharging: (stationId: string) => void;
  pauseCharging: (stationId: string) => void;
  stopCharging: (stationId: string) => void;
  addStation: () => void;
  removeStation: (stationId: string) => void;
  setLoadPower: (id: string, powerKw: number) => void;
  setSiteLimit: (limit: number) => void;
  toggleRunState: () => void;
  setTimeScale: (scale: number) => void;
  exportScenario: () => SavedScenarioPayload;
  importScenario: (payload: SavedScenarioPayload) => void;
}

const BATTERY_KWH = 70;
const BASE_TICK_MS = 1000;
const MAX_LOGS = 500;
const HISTORY_POINTS = 180;
const CUSTOM_SCENARIO_ID = "custom";
const CUSTOM_SCENARIO_DESC = "Ad-hoc configuration";

const bus = createMessageBus();
let ticker: ReturnType<typeof setInterval> | null = null;
let stationCounter = 1;

const defaultScenario = scenarios[0];

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

function createStation(name: string, targetKw: number, soc: number): ChargerStation {
  return {
    id: nanoid(4).toUpperCase(),
    name,
    session: createSession(targetKw, soc),
  };
}

function computeFacilityKw(loads: Load[]): number {
  return loads.reduce((sum, load) => sum + load.powerKw, 0);
}

function applyScenarioConfig(config: ScenarioConfig) {
  const stations = config.stations.map((preset) => createStation(preset.name, preset.targetKw, preset.soc));
  stationCounter = stations.length + 1;
  const loads = config.loads.map((load) => ({ ...load }));
  const facilityKw = computeFacilityKw(loads);
  const ems: EmsConfig = {
    siteLimitKw: config.siteLimitKw,
    strategy: "throttle-ev",
    activeCommands: [],
    decisionLog: [],
  };
  const meter: MeterReading = {
    timestamp: Date.now(),
    totalKw: facilityKw,
    limitKw: ems.siteLimitKw,
    history: Array.from({ length: HISTORY_POINTS }, () => facilityKw),
    evKw: 0,
    facilityKw,
    perStationKw: stations.map((station) => ({ id: station.id, name: station.name, kw: 0 })),
  };
  return { stations, loads, ems, meter };
}

function syncTicker(
  getState: () => SimulationState,
  applyPartial: (partial: Partial<SimulationState>) => void,
) {
  if (typeof window === "undefined") return;
  if (ticker) {
    window.clearInterval(ticker);
    ticker = null;
  }
  const state = getState();
  if (!state.isRunning) return;
  const interval = Math.max(200, BASE_TICK_MS / state.timeScale);
  ticker = window.setInterval(() => {
    tickSimulation(getState, applyPartial);
  }, interval);
}

function logOcpp(entry: Omit<ProtocolLogEntry, "id" | "timestamp" | "channel"> & { channel?: ProtocolLogEntry["channel"] }) {
  bus.publish("log", {
    id: nanoid(),
    timestamp: Date.now(),
    channel: entry.channel ?? "OCPP",
    ...entry,
  });
}

function tickSimulation(
  getState: () => SimulationState,
  setState: (partial: Partial<SimulationState>) => void,
) {
  const state = getState();
  const dtHours = BASE_TICK_MS / 3_600_000;
  const facilityKw = computeFacilityKw(state.loads);
  const availableForChargers = Math.max(state.ems.siteLimitKw - facilityKw, 0);
  const chargingStations = state.stations.filter((station) => station.session.state === "charging");
  const totalDemand = chargingStations.reduce((sum, station) => sum + station.session.targetKw, 0);
  const scaling = totalDemand > 0 ? Math.min(1, availableForChargers / totalDemand) : 0;

  const wasThrottling = state.ems.activeCommands.length > 0;

  const updatedStations = state.stations.map((station) => {
    let session = station.session;

    if (session.state === "charging") {
      const targetScale = scaling || (availableForChargers > 0 ? 1 : 0);
      const actualKw = Number((session.targetKw * targetScale).toFixed(2));

      if (Math.abs(actualKw - session.actualKw) > 0.2) {
        logOcpp({
          direction: "csms->cp",
          message: `SetChargingProfile → ${actualKw.toFixed(1)} kW`,
          payload: { availableForChargers, totalDemand },
          stationId: station.id,
          stationName: station.name,
        });
        logOcpp({
          direction: "csms->cp",
          message: "StatusNotification",
          payload: { status: actualKw > 0 ? "Charging" : "Suspended", actualKw },
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

      logOcpp({
        direction: "cp->csms",
        message: "MeterValues",
        payload: {
          powerKw: actualKw,
          deliveredKwh: session.deliveredKwh,
          soc: session.vehicleSocCurrent,
        },
        stationId: station.id,
        stationName: station.name,
      });

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
        logOcpp({
          direction: "cp->csms",
          message: "StopTransaction (completed)",
          stationId: station.id,
          stationName: station.name,
          payload: { deliveredKwh: session.deliveredKwh },
        });
        logOcpp({
          direction: "csms->cp",
          message: "StatusNotification",
          payload: { status: "Available" },
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

  const ems: EmsConfig = {
    ...state.ems,
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

function makeCustomFlag(state: SimulationState) {
  if (state.scenarioId === CUSTOM_SCENARIO_ID) return {};
  return { scenarioId: CUSTOM_SCENARIO_ID, scenarioDescription: CUSTOM_SCENARIO_DESC };
}

export const useSimulationStore = create<SimulationState>()((set, get) => {
  bus.subscribe("log", (entry) => {
    set((state) => ({ logs: [entry, ...state.logs].slice(0, MAX_LOGS) }));
  });

  const initial = applyScenarioConfig(defaultScenario);

  const baseState: SimulationState = {
    scenarioId: defaultScenario.id,
    scenarioDescription: defaultScenario.description,
    stations: initial.stations,
    loads: initial.loads,
    ems: initial.ems,
    meter: initial.meter,
    logs: [],
    isRunning: true,
    timeScale: 1,
    selectScenario: (id) => {
      const config = getScenarioById(id) ?? scenarios[0];
      const applied = applyScenarioConfig(config);
      set((state) => ({
        scenarioId: config.id,
        scenarioDescription: config.description,
        stations: applied.stations,
        loads: applied.loads,
        ems: applied.ems,
        meter: applied.meter,
        logs: state.logs,
      }) satisfies Partial<SimulationState>);
      logOcpp({ channel: "System", direction: "cp->csms", message: `Scenario loaded: ${config.name}` });
      syncTicker(get, (partial) => set((current) => ({ ...current, ...partial })));
    },
    startCharging: (stationId) => {
      const now = Date.now();
      set((state) => {
        const stations: ChargerStation[] = state.stations.map((station): ChargerStation => {
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
          logOcpp({
            direction: "cp->csms",
            message: "Authorize",
            stationId: station.id,
            stationName: station.name,
            payload: { targetKw: session.targetKw },
          });
          logOcpp({
            direction: "cp->csms",
            message: "StartTransaction",
            stationId: station.id,
            stationName: station.name,
            payload: { targetKw: session.targetKw },
          });
          return { ...station, session: { ...session, state: "charging" } };
        });
        return { stations } satisfies Partial<SimulationState>;
      });
    },
    pauseCharging: (stationId) => {
      set((state) => {
        const stations: ChargerStation[] = state.stations.map((station): ChargerStation => {
          if (station.id !== stationId) return station;
          if (station.session.state !== "charging") return station;
          logOcpp({
            direction: "cp->csms",
            message: "RemoteStopRequest",
            stationId: station.id,
            stationName: station.name,
          });
          const updated: ChargingSession = { ...station.session, state: "pausing", actualKw: 0 };
          return { ...station, session: updated };
        });
        return { stations } satisfies Partial<SimulationState>;
      });
    },
    stopCharging: (stationId) => {
      set((state) => {
        const stations: ChargerStation[] = state.stations.map((station): ChargerStation => {
          if (station.id !== stationId) return station;
          if (station.session.state === "idle") return station;
          const session: ChargingSession = {
            ...station.session,
            state: "finished",
            endedAt: Date.now(),
            actualKw: 0,
          };
          logOcpp({
            direction: "cp->csms",
            message: "StopTransaction",
            stationId: station.id,
            stationName: station.name,
            payload: { deliveredKwh: session.deliveredKwh },
          });
          return { ...station, session };
        });
        return { stations } satisfies Partial<SimulationState>;
      });
    },
    addStation: () => {
      set((state) => {
        const station = createStation(`Charger ${stationCounter++}`, 11, 40);
        logOcpp({
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
        return {
          stations: [...state.stations, station],
          meter,
          ...makeCustomFlag(state),
        } satisfies Partial<SimulationState>;
      });
    },
    removeStation: (stationId) => {
      set((state) => {
        if (state.stations.length <= 1) return state;
        const station = state.stations.find((item) => item.id === stationId);
        if (!station) return state;
        logOcpp({
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
        return { stations, meter, ...makeCustomFlag(state) } satisfies Partial<SimulationState>;
      });
    },
    setLoadPower: (id, powerKw) => {
      const value = Math.max(0, Math.min(60, powerKw));
      set((state) => ({
        loads: state.loads.map((load) => (load.id === id ? { ...load, powerKw: value } : load)),
        ...makeCustomFlag(state),
      }));
    },
    setSiteLimit: (limit) => {
      set((state) => ({
        ems: { ...state.ems, siteLimitKw: limit },
        meter: { ...state.meter, limitKw: limit },
        ...makeCustomFlag(state),
      }));
    },
    toggleRunState: () => {
      set((state) => ({ isRunning: !state.isRunning }));
      syncTicker(get, (partial) => set((current) => ({ ...current, ...partial })));
    },
    setTimeScale: (scale) => {
      set(() => ({ timeScale: scale }));
      syncTicker(get, (partial) => set((current) => ({ ...current, ...partial })));
    },
    exportScenario: () => {
      const state = get();
      return {
        title: state.scenarioId,
        note: state.scenarioDescription,
        createdAt: Date.now(),
        siteLimitKw: state.ems.siteLimitKw,
        stations: state.stations.map((station) => ({
          name: station.name,
          session: station.session,
        })),
        loads: state.loads,
      } satisfies SavedScenarioPayload;
    },
    importScenario: (payload) => {
      set((state) => {
        const stations = payload.stations.map(({ name, session }) => {
          const preset = createStation(name, session.targetKw, session.vehicleSocCurrent ?? session.vehicleSocStart);
          return {
            ...preset,
            session: {
              ...preset.session,
              targetKw: session.targetKw,
              vehicleSocTarget: session.vehicleSocTarget,
              requestedDurationMin: session.requestedDurationMin,
            },
          };
        });
        stationCounter = stations.length + 1;
        const loads = payload.loads.map((load) => ({ ...load }));
        const facilityKw = computeFacilityKw(loads);
        const meter: MeterReading = {
          timestamp: Date.now(),
          totalKw: facilityKw,
          limitKw: payload.siteLimitKw,
          history: Array.from({ length: HISTORY_POINTS }, () => facilityKw),
          evKw: 0,
          facilityKw,
          perStationKw: stations.map((station) => ({ id: station.id, name: station.name, kw: 0 })),
        };
        const ems: EmsConfig = {
          siteLimitKw: payload.siteLimitKw,
          strategy: "throttle-ev",
          activeCommands: [],
          decisionLog: [],
        };
        logOcpp({ channel: "System", direction: "cp->csms", message: `Scenario imported (${payload.title})` });
        return {
          scenarioId: `${payload.title || CUSTOM_SCENARIO_ID}`,
          scenarioDescription: payload.note || "Imported scenario",
          stations,
          loads,
          ems,
          meter,
          logs: state.logs,
        } satisfies Partial<SimulationState>;
      });
      syncTicker(get, (partial) => set((current) => ({ ...current, ...partial })));
    },
  };

  const store = baseState;

  if (typeof window !== "undefined") {
    setTimeout(() => syncTicker(get, (partial) => set((current) => ({ ...current, ...partial }))), 0);
  }

  return store;
});
