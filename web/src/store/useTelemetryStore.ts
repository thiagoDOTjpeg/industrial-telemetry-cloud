import { create } from 'zustand';
import type { Telemetry } from '../App';

export interface FilterState {
  machineId: string;
  status: string;
  interval: string;
  limit: number;
}

interface TelemetryState {
  data: Telemetry[];
  connected: boolean;
  filters: FilterState;
  setConnected: (status: boolean) => void;
  setInitialData: (history: Telemetry[]) => void;
  addBatch: (batch: Telemetry[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  getFilteredData: () => Telemetry[];
}

const defaultFilters: FilterState = {
  machineId: '',
  status: '',
  interval: '1 hour',
  limit: 50,
};

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  data: [],
  connected: false,
  filters: { ...defaultFilters },
  setConnected: (status) => set({ connected: status }),
  setInitialData: (history) => set({ data: history }),
  addBatch: (batch) => set((state) => {
    const { filters } = state;
    // Filtrar dados WebSocket localmente
    const filteredBatch = batch.filter((item) => {
      if (filters.machineId && item.machine_id !== filters.machineId) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
    return {
      data: [...state.data, ...filteredBatch].slice(-filters.limit)
    };
  }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  getFilteredData: () => {
    const { data, filters } = get();
    return data.filter((item) => {
      if (filters.machineId && item.machine_id !== filters.machineId) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
  },
}));