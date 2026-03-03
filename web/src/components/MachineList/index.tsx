import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";
import { useTelemetryStore } from "../../store/useTelemetryStore";
import { Card } from "../Card";

interface MachineListProps {
  onSelectMachine: (machineId: string) => void;
}

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

interface MachineInfo {
  machine_id: string;
  status: string;
  lastTemperature: number;
  lastVibration: number;
  lastTimestamp: string;
}

export function MachineList({ onSelectMachine }: MachineListProps) {
  const data = useTelemetryStore((state) => state.data);

  const machines = useMemo(() => {
    const machineMap = new Map<string, MachineInfo>();

    // Pegar o último registro de cada máquina
    data.forEach((item) => {
      machineMap.set(item.machine_id, {
        machine_id: item.machine_id,
        status: item.status,
        lastTemperature: item.temperature,
        lastVibration: item.vibration_level,
        lastTimestamp: item.timestamp,
      });
    });

    return Array.from(machineMap.values()).sort((a, b) =>
      a.machine_id.localeCompare(b.machine_id),
    );
  }, [data]);

  if (machines.length === 0) {
    return (
      <Card padding="md" className="h-full">
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
          Máquinas Monitoradas
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Cpu size={32} className="mb-2 opacity-50" />
          <p className="text-sm">Nenhuma máquina encontrada</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="md"
      className="h-full flex flex-col"
      role="region"
      aria-label="Lista de máquinas monitoradas"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Máquinas Monitoradas
        </h3>
        <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
          {machines.length} {machines.length === 1 ? "máquina" : "máquinas"}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar"
        role="list"
        aria-label="Lista de máquinas"
      >
        {machines.map((machine) => {
          const config =
            statusConfig[machine.status as keyof typeof statusConfig] ||
            statusConfig.OPERATIONAL;
          const StatusIcon = config.icon;

          return (
            <button
              key={machine.machine_id}
              onClick={() => onSelectMachine(machine.machine_id)}
              className={`
                w-full flex items-center justify-between p-3 rounded-xl
                border ${config.borderClass} ${config.bgClass}
                hover:bg-slate-800/60 hover:border-slate-600
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
                group
              `}
              role="listitem"
              aria-label={`Máquina ${machine.machine_id}, status: ${config.label}. Clique para ver detalhes.`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${config.bgClass} border ${config.borderClass}`}
                >
                  <StatusIcon
                    size={18}
                    className={config.textClass}
                    aria-hidden="true"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-200">
                    {machine.machine_id}
                  </p>
                  <p className={`text-xs ${config.textClass}`}>
                    {config.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Temp</p>
                  <p className="text-sm font-medium text-slate-300">
                    {machine.lastTemperature.toFixed(1)}°C
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Vibração</p>
                  <p className="text-sm font-medium text-slate-300">
                    {machine.lastVibration.toFixed(2)}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-500 group-hover:text-emerald-400 transition-colors"
                  aria-hidden="true"
                />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
