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

const MAX_DATA_SIZE = 500;

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  data: [],
  connected: false,
  filters: { ...defaultFilters },
  setConnected: (status) => set({ connected: status }),
  setInitialData: (history) => set({ data: history.slice(-MAX_DATA_SIZE) }),
  addBatch: (batch) => set((state) => {
    const { filters } = state;
    const filteredBatch = batch.filter((item) => {
      if (filters.machineId && item.machine_id !== filters.machineId) return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });

    const maxSize = Math.min(filters.limit, MAX_DATA_SIZE);
    const newData = [...state.data, ...filteredBatch];

    return {
      data: newData.slice(-maxSize)
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