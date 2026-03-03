import { Filter, RotateCcw, Search } from "lucide-react";
import { useMemo } from "react";
import { useTelemetryStore } from "../../store/useTelemetryStore";

interface FilterBarProps {
  onApplyFilters: () => void;
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

export function FilterBar({ onApplyFilters }: FilterBarProps) {
  const { data, filters, setFilters, resetFilters } = useTelemetryStore();

  // Extrair machine_ids únicos dos dados
  const machineIds = useMemo(() => {
    const ids = [...new Set(data.map((item) => item.machine_id))].sort();
    return ids;
  }, [data]);

  const handleReset = () => {
    resetFilters();
    onApplyFilters();
  };

  return (
    <div
      className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-4 mb-6"
      role="search"
      aria-label="Filtros de telemetria"
    >
      <div className="flex items-center gap-2 mb-4">
        <Filter className="text-emerald-400" size={18} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-300">Filtros</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Machine ID Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="machine-filter"
            className="text-xs font-medium text-slate-400"
          >
            Máquina
          </label>
          <select
            id="machine-filter"
            value={filters.machineId}
            onChange={(e) => setFilters({ machineId: e.target.value })}
            className="
              bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2
              text-sm text-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              transition-all duration-200
              hover:border-slate-600
            "
            aria-label="Filtrar por máquina"
          >
            <option value="">Todas as máquinas</option>
            {machineIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status-filter"
            className="text-xs font-medium text-slate-400"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            className="
              bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2
              text-sm text-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              transition-all duration-200
              hover:border-slate-600
            "
            aria-label="Filtrar por status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Interval Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="interval-filter"
            className="text-xs font-medium text-slate-400"
          >
            Período
          </label>
          <select
            id="interval-filter"
            value={filters.interval}
            onChange={(e) => setFilters({ interval: e.target.value })}
            className="
              bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2
              text-sm text-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              transition-all duration-200
              hover:border-slate-600
            "
            aria-label="Filtrar por período"
          >
            {INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Limit Filter */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="limit-filter"
            className="text-xs font-medium text-slate-400"
          >
            Limite
          </label>
          <select
            id="limit-filter"
            value={filters.limit}
            onChange={(e) => setFilters({ limit: Number(e.target.value) })}
            className="
              bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-2
              text-sm text-slate-200
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              transition-all duration-200
              hover:border-slate-600
            "
            aria-label="Limite de registros"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-slate-400 invisible">
            Ações
          </span>
          <div className="flex gap-2">
            <button
              onClick={onApplyFilters}
              className="
                flex-1 flex items-center justify-center gap-2
                bg-emerald-600 hover:bg-emerald-500
                text-white text-sm font-medium
                px-4 py-2 rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
                shadow-lg shadow-emerald-500/20
                hover:shadow-emerald-500/30
              "
              aria-label="Aplicar filtros"
            >
              <Search size={16} aria-hidden="true" />
              Aplicar
            </button>
            <button
              onClick={handleReset}
              className="
                flex items-center justify-center gap-2
                bg-slate-700 hover:bg-slate-600
                text-slate-200 text-sm font-medium
                px-3 py-2 rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
              "
              aria-label="Limpar filtros"
              title="Limpar filtros"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
