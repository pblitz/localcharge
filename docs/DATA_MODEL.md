# Data Model Draft

These TypeScript interfaces will guide simulation + UI development.

```ts
export type ChargerState = "idle" | "preparing" | "charging" | "pausing" | "fault" | "finished";

export interface ChargingSession {
  id: string;
  startedAt: number; // epoch ms
  endedAt?: number;
  targetKw: number;
  requestedDurationMin: number;
  deliveredKwh: number;
  vehicleSocStart: number; // 0-100
  vehicleSocTarget: number; // 0-100
  state: ChargerState;
}

export interface Load {
  id: string;
  name: string;
  type: "static" | "sched" | "script";
  powerKw: number; // current draw
  schedule?: LoadSchedule;
}

export interface LoadSchedule {
  entries: Array<{
    startMin: number; // minutes from sim start
    powerKw: number;
  }>;
  loop?: boolean;
}

export interface MeterReading {
  timestamp: number;
  totalKw: number;
  phaseKw: [number, number, number];
  voltage: [number, number, number];
  current: [number, number, number];
}

export type OcppMessageDirection = "csms->cp" | "cp->csms";

export interface OcppMessage {
  id: string;
  timestamp: number;
  direction: OcppMessageDirection;
  action: string; // e.g., "StartTransaction"
  payload: Record<string, unknown>;
}

export interface ModbusFrame {
  id: string;
  timestamp: number;
  register: string;
  value: number;
  unit: string;
}

export interface SiteConfig {
  siteLimitKw: number;
  perPhaseLimitKw?: number;
  strategy: "throttle-ev" | "shed-loads" | "mixed";
}
```

These definitions will evolve as we implement multi-event timelines, scenario persistence, and UI selections.
