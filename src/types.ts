export type ChargerState = "idle" | "preparing" | "charging" | "pausing" | "fault" | "finished";

export interface ChargingSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  targetKw: number;
  requestedDurationMin: number;
  deliveredKwh: number;
  vehicleSocStart: number;
  vehicleSocTarget: number;
  state: ChargerState;
}

export interface Load {
  id: string;
  name: string;
  type: "static" | "sched" | "script";
  powerKw: number;
}

export interface MeterReading {
  timestamp: number;
  totalKw: number;
  limitKw: number;
  history: number[];
}

export interface EmsConfig {
  siteLimitKw: number;
  strategy: "throttle-ev" | "shed-loads" | "mixed";
  activeCommands: string[];
  decisionLog: Array<{ timestamp: number; message: string }>;
}

export type OcppMessageDirection = "csms->cp" | "cp->csms";

export interface ProtocolLogEntry {
  id: string;
  timestamp: number;
  direction: OcppMessageDirection | "modbus";
  channel: "OCPP" | "Modbus" | "System";
  message: string;
  payload?: Record<string, unknown>;
}
