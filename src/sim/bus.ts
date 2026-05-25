import type { MeterReading, ProtocolLogEntry } from "../types";

export type BusEvents = {
  log: ProtocolLogEntry;
  meter: MeterReading;
};

type Listener<K extends keyof BusEvents> = (payload: BusEvents[K]) => void;

export function createMessageBus() {
    const listeners: { [K in keyof BusEvents]: Set<Listener<K>> } = {
    log: new Set(),
    meter: new Set(),
  };

  return {
    publish<K extends keyof BusEvents>(event: K, payload: BusEvents[K]) {
      listeners[event].forEach((listener) => listener(payload));
    },
    subscribe<K extends keyof BusEvents>(event: K, listener: Listener<K>) {
      listeners[event].add(listener);
      return () => listeners[event].delete(listener);
    },
  } as const;
}

export type MessageBus = ReturnType<typeof createMessageBus>;
