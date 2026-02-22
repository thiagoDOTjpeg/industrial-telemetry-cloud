import { create } from 'zustand';
import type { Telemetry } from '../App';

interface TelemetryState {
  data: Telemetry[];
  connected: boolean;
  setConnected: (status: boolean) => void;
  setInitialData: (history: Telemetry[]) => void;
  addBatch: (batch: Telemetry[]) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  data: [],
  connected: false,
  setConnected: (status) => set({ connected: status }),
  setInitialData: (history) => set({ data: history }),
  addBatch: (batch) => set((state) => ({
    data: [...state.data, ...batch].slice(-50)
  })),
}));