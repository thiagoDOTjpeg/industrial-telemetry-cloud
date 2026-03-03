import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Thermometer,
  Vibrate,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import type { Telemetry } from "../../App";
import { useWebSocket } from "../../hooks/useWebSocket";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface MachineDetailModalProps {
  machineId: string;
  isOpen: boolean;
  onClose: () => void;
  restUrl: string;
  wsUrl: string;
}

interface ModalFilters {
  status: string;
  interval: string;
  limit: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "OPERATIONAL", label: "Operacional" },
  { value: "WARNING", label: "Alerta" },
  { value: "CRITICAL", label: "Crítico" },
];

const INTERVAL_OPTIONS = [
  { value: "30 minutes", label: "30 minutos" },
  { value: "1 hour", label: "1 hora" },
  { value: "2 hours", label: "2 horas" },
  { value: "6 hours", label: "6 horas" },
  { value: "24 hours", label: "24 horas" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10 registros" },
  { value: 25, label: "25 registros" },
  { value: 50, label: "50 registros" },
  { value: 100, label: "100 registros" },
];

const statusConfig = {
  OPERATIONAL: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    label: "Operacional",
  },
  WARNING: {
    icon: AlertTriangle,
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-400",
    label: "Alerta",
  },
  CRITICAL: {
    icon: XCircle,
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
    label: "Crítico",
  },
};

const defaultFilters: ModalFilters = {
  status: "",
  interval: "1 hour",
  limit: 50,
};

const MAX_MODAL_DATA_SIZE = 200;

const MAX_RETRIES = 4;
const BASE_DELAY = 1000;
const MAX_DELAY = 16000;

interface PersistentStats {
  minTemp: number;
  maxTemp: number;
  vibSum: number;
  vibCount: number;
}

const initialPersistentStats: PersistentStats = {
  minTemp: Infinity,
  maxTemp: -Infinity,
  vibSum: 0,
  vibCount: 0,
};

export function MachineDetailModal({
  machineId,
  isOpen,
  onClose,
  restUrl,
  wsUrl,
}: MachineDetailModalProps) {
  const [filters, setFilters] = useState<ModalFilters>({ ...defaultFilters });
  const [wsData, setWsData] = useState<Telemetry[]>([]);
  const [persistentStats, setPersistentStats] = useState<PersistentStats>({
    ...initialPersistentStats,
  });

  const filtersRef = useRef(filters);
  const machineIdRef = useRef(machineId);

  useEffect(() => {
    filtersRef.current = filters;
    machineIdRef.current = machineId;
  }, [filters, machineId]);

  useEffect(() => {
    queueMicrotask(() => {
      setWsData([]);
      setPersistentStats({ ...initialPersistentStats });
    });
  }, [machineId, filters]);

  const buildQueryUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("machine_id", machineId);
    if (filters.status) params.append("status", filters.status);
    if (filters.interval) params.append("interval", filters.interval);
    if (filters.limit) params.append("limit", String(filters.limit));
    return `${restUrl}?${params.toString()}`;
  }, [machineId, filters, restUrl]);

  const {
    data: initialData,
    isLoading,
    isError: restError,
    refetch,
  } = useQuery({
    queryKey: ["machine-detail", machineId, filters],
    queryFn: async () => {
      const url = buildQueryUrl();
      const res = await axios.get(url);
      return (res.data as Telemetry[]).reverse();
    },
    enabled: isOpen && !!machineId,
    refetchOnWindowFocus: false,
    retry: MAX_RETRIES,
    retryDelay: (attemptIndex) =>
      Math.min(BASE_DELAY * Math.pow(2, attemptIndex), MAX_DELAY),
  });

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      queueMicrotask(() => {
        const temps = initialData.map((d) => d.temperature);
        const vibs = initialData.map((d) => d.vibration_level);

        setPersistentStats({
          minTemp: Math.min(...temps),
          maxTemp: Math.max(...temps),
          vibSum: vibs.reduce((a, b) => a + b, 0),
          vibCount: vibs.length,
        });
      });
    }
  }, [initialData]);

  const handleWsMessage = useCallback((batch: Telemetry[]) => {
    const currentFilters = filtersRef.current;
    const currentMachineId = machineIdRef.current;

    const filteredBatch = batch.filter((item) => {
      if (item.machine_id !== currentMachineId) return false;
      if (currentFilters.status && item.status !== currentFilters.status)
        return false;
      return true;
    });

    if (filteredBatch.length > 0) {
      setWsData((prev) => {
        const maxSize = Math.min(currentFilters.limit, MAX_MODAL_DATA_SIZE);
        return [...prev, ...filteredBatch].slice(-maxSize);
      });

      setPersistentStats((prev) => {
        const newTemps = filteredBatch.map((d) => d.temperature);
        const newVibs = filteredBatch.map((d) => d.vibration_level);

        return {
          minTemp: Math.min(prev.minTemp, ...newTemps),
          maxTemp: Math.max(prev.maxTemp, ...newTemps),
          vibSum: prev.vibSum + newVibs.reduce((a, b) => a + b, 0),
          vibCount: prev.vibCount + newVibs.length,
        };
      });
    }
  }, []);

  const {
    connected: wsConnected,
    error: wsError,
    reconnect: handleWsReconnect,
  } = useWebSocket<Telemetry[]>({
    url: wsUrl,
    enabled: isOpen && !!machineId,
    onMessage: handleWsMessage,
  });

  const data = useMemo(() => {
    if (!initialData) return wsData;
    const combined = [...initialData, ...wsData];
    const maxSize = Math.min(filters.limit, MAX_MODAL_DATA_SIZE);
    return combined.slice(-maxSize);
  }, [initialData, wsData, filters.limit]);

  const handleApplyFilters = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleResetFilters = () => {
    setWsData([]);
    setPersistentStats({ ...initialPersistentStats });
    setFilters({ ...defaultFilters });
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const labels = data.map((d) =>
      new Date(d.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );

    return {
      temperature: {
        labels,
        datasets: [
          {
            label: "Temperatura (°C)",
            data: data.map((d) => d.temperature),
            borderColor: "#f97316",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
          },
        ],
      },
      vibration: {
        labels,
        datasets: [
          {
            label: "Vibração",
            data: data.map((d) => d.vibration_level),
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
          },
        ],
      },
    };
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const latestStatus = data[data.length - 1]?.status || "OPERATIONAL";

    // Usar stats persistentes em vez de calcular do array atual
    const hasValidStats = persistentStats.minTemp !== Infinity;

    return {
      avgTemp: hasValidStats
        ? ((persistentStats.minTemp + persistentStats.maxTemp) / 2).toFixed(1)
        : "0.0",
      maxTemp: hasValidStats ? persistentStats.maxTemp.toFixed(1) : "0.0",
      minTemp: hasValidStats ? persistentStats.minTemp.toFixed(1) : "0.0",
      avgVib:
        persistentStats.vibCount > 0
          ? (persistentStats.vibSum / persistentStats.vibCount).toFixed(2)
          : "0.00",
      maxVib: hasValidStats
        ? Math.max(...data.map((d) => d.vibration_level)).toFixed(2)
        : "0.00",
      status: latestStatus,
      totalRecords: data.length,
    };
  }, [data, persistentStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(51, 65, 85, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(51, 65, 85, 0.3)" },
        ticks: { color: "#64748b", maxTicksLimit: 8 },
      },
      y: {
        grid: { color: "rgba(51, 65, 85, 0.3)" },
        ticks: { color: "#64748b" },
      },
    },
  };

  if (!isOpen) return null;

  const statusInfo =
    statusConfig[(stats?.status as keyof typeof statusConfig) || "OPERATIONAL"];
  const StatusIcon = statusInfo?.icon || CheckCircle2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${statusInfo?.bgClass} border ${statusInfo?.borderClass}`}
            >
              <StatusIcon
                size={24}
                className={statusInfo?.textClass}
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-slate-100">
                {machineId}
              </h2>
              <p className={`text-sm ${statusInfo?.textClass}`}>
                {statusInfo?.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* WebSocket Status */}
            <div
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold
                transition-all duration-200
                ${
                  wsConnected
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }
              `}
              role="status"
              aria-live="polite"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                aria-hidden="true"
              />
              {wsConnected ? (
                <Wifi size={12} aria-hidden="true" />
              ) : (
                <WifiOff size={12} aria-hidden="true" />
              )}
              <span>{wsConnected ? "LIVE" : "OFFLINE"}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Fechar modal"
            >
              <X size={24} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="text-emerald-400" size={16} aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Filtros
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Filtrar por status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filters.interval}
              onChange={(e) =>
                setFilters((f) => ({ ...f, interval: e.target.value }))
              }
              className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Filtrar por período"
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filters.limit}
              onChange={(e) =>
                setFilters((f) => ({ ...f, limit: Number(e.target.value) }))
              }
              className="bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Limite de registros"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <Search size={14} aria-hidden="true" />
                Aplicar
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                title="Limpar filtros"
              >
                <RotateCcw size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Erro de conexão REST API */}
          {restError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-400" size={20} />
                <span className="text-red-400 font-medium">
                  Não foi possível conectar com o servidor
                </span>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                Tentar novamente
              </button>
            </div>
          )}

          {/* Erro de conexão WebSocket */}
          {wsError && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="text-orange-400" size={20} />
                <span className="text-orange-400 font-medium">{wsError}</span>
              </div>
              <button
                onClick={handleWsReconnect}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
                Reconectar
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <AlertTriangle size={48} className="mb-4 opacity-50" />
              <p>Nenhum dado encontrado para esta máquina</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Temp. Média
                  </p>
                  <p className="text-2xl font-bold text-orange-400">
                    {stats?.avgTemp}°C
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Temp. Máx
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {stats?.maxTemp}°C
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Vibração Média
                  </p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {stats?.avgVib}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Registros
                  </p>
                  <p className="text-2xl font-bold text-slate-300">
                    {stats?.totalRecords}
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature Chart */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Thermometer
                      size={18}
                      className="text-orange-400"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold text-slate-300">
                      Temperatura
                    </h3>
                  </div>
                  <div className="h-48">
                    {chartData && (
                      <Line
                        data={chartData.temperature}
                        options={chartOptions}
                      />
                    )}
                  </div>
                </div>

                {/* Vibration Chart */}
                <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Vibrate
                      size={18}
                      className="text-cyan-400"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold text-slate-300">
                      Vibração
                    </h3>
                  </div>
                  <div className="h-48">
                    {chartData && (
                      <Line data={chartData.vibration} options={chartOptions} />
                    )}
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-300">
                    Logs de Eventos
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-slate-400 font-medium">
                          Timestamp
                        </th>
                        <th className="text-left px-4 py-2 text-slate-400 font-medium">
                          Status
                        </th>
                        <th className="text-right px-4 py-2 text-slate-400 font-medium">
                          Temperatura
                        </th>
                        <th className="text-right px-4 py-2 text-slate-400 font-medium">
                          Vibração
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => {
                        const itemStatus =
                          statusConfig[
                            item.status as keyof typeof statusConfig
                          ] || statusConfig.OPERATIONAL;
                        return (
                          <tr
                            key={idx}
                            className="border-t border-slate-700/30 hover:bg-slate-800/30"
                          >
                            <td className="px-4 py-2 text-slate-300">
                              {new Date(item.timestamp).toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${itemStatus.bgClass} ${itemStatus.textClass}`}
                              >
                                {itemStatus.label}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-orange-400">
                              {item.temperature.toFixed(1)}°C
                            </td>
                            <td className="px-4 py-2 text-right text-cyan-400">
                              {item.vibration_level.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
