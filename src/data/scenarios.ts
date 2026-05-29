import type { ScenarioConfig } from "../types";

export const scenarios: ScenarioConfig[] = [
  {
    id: "single-ev",
    name: "Single EV",
    description: "One 22 kW charger, base site loads",
    siteLimitKw: 80,
    stations: [
      { name: "Charger 1", targetKw: 22, soc: 30 },
    ],
    loads: [
      { id: "l1", name: "HVAC", type: "sched", powerKw: 12 },
      { id: "l2", name: "Lighting", type: "static", powerKw: 4.5 },
      { id: "l3", name: "Production", type: "script", powerKw: 26 },
    ],
  },
  {
    id: "peak-afternoon",
    name: "Peak Afternoon",
    description: "Three chargers, tighter site limit",
    siteLimitKw: 65,
    stations: [
      { name: "Fleet 1", targetKw: 22, soc: 20 },
      { name: "Fleet 2", targetKw: 11, soc: 40 },
      { name: "Visitor", targetKw: 7, soc: 55 },
    ],
    loads: [
      { id: "l1", name: "HVAC", type: "sched", powerKw: 18 },
      { id: "l2", name: "Lighting", type: "static", powerKw: 6 },
      { id: "l3", name: "Production", type: "script", powerKw: 32 },
      { id: "l4", name: "Server Rack", type: "static", powerKw: 5 },
    ],
  },
  {
    id: "maintenance-window",
    name: "Maintenance Window",
    description: "Two chargers + low facility load for overnight charging",
    siteLimitKw: 50,
    stations: [
      { name: "Night Shift 1", targetKw: 11, soc: 35 },
      { name: "Night Shift 2", targetKw: 11, soc: 45 },
    ],
    loads: [
      { id: "l1", name: "Lighting", type: "static", powerKw: 3 },
      { id: "l2", name: "Security", type: "static", powerKw: 2 },
    ],
  },
];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
