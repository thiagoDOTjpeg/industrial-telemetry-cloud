import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Telemetry } from "../App";
import { useTelemetryStore } from "../store/useTelemetryStore";
import { WS_BASE_DELAY, WS_MAX_DELAY, WS_MAX_RETRIES } from "./useWebSocket";

const REST_URL = String(import.meta.env.VITE_REST_URL) || "";

export function useTelemetryQuery() {
  const { setInitialData, filters } = useTelemetryStore();

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (filters.machineId) params.append("machine_id", filters.machineId);
    if (filters.status) params.append("status", filters.status);
    if (filters.interval) params.append("interval", filters.interval);
    if (filters.limit) params.append("limit", String(filters.limit));
    const queryString = params.toString();
    return queryString ? `${REST_URL}?${queryString}` : REST_URL;
  };

  return useQuery({
    queryKey: ["telemetry-history", filters],
    queryFn: async () => {
      const url = buildQueryUrl();
      const res = await axios.get<Telemetry[]>(url);
      const history = res.data.reverse();
      setInitialData(history);
      return history;
    },
    refetchOnWindowFocus: false,
    retry: WS_MAX_RETRIES,
    retryDelay: (attemptIndex) =>
      Math.min(WS_BASE_DELAY * Math.pow(2, attemptIndex), WS_MAX_DELAY),
  });
}
