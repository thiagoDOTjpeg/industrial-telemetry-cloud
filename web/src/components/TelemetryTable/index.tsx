import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Thermometer,
  Waves,
  XCircle,
} from "lucide-react";
import React from "react";
import { useTelemetryStore } from "../../store/useTelemetryStore";
import { Card } from "../Card";

interface StatusBadgeInlineProps {
  status: string;
}

function StatusBadgeInline({ status }: StatusBadgeInlineProps) {
  const config = {
    OPERATIONAL: {
      icon: CheckCircle2,
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/20",
      textClass: "text-emerald-400",
      hoverBg: "group-hover:bg-emerald-500/20",
      label: "Operacional",
    },
    WARNING: {
      icon: AlertTriangle,
      bgClass: "bg-orange-500/10",
      borderClass: "border-orange-500/20",
      textClass: "text-orange-400",
      hoverBg: "group-hover:bg-orange-500/20",
      label: "Alerta",
    },
    CRITICAL: {
      icon: XCircle,
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/20",
      textClass: "text-red-400",
      hoverBg: "group-hover:bg-red-500/20",
      label: "Crítico",
    },
  };

  const statusConfig =
    config[status as keyof typeof config] || config.OPERATIONAL;
  const Icon = statusConfig.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
        border transition-colors duration-200
        ${statusConfig.bgClass} ${statusConfig.borderClass} ${statusConfig.textClass} ${statusConfig.hoverBg}
      `}
      role="status"
      aria-label={`Status: ${statusConfig.label}`}
    >
      <Icon size={12} aria-hidden="true" />
      {status}
    </span>
  );
}

export const TelemetryTable: React.FC = () => {
  const { data, connected } = useTelemetryStore();

  const isLoading = connected && data.length === 0;

  if (isLoading) {
    return (
      <div
        className="p-8 text-center text-slate-500 animate-pulse"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Carregando...</span>
        Sincronizando dados industriais...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 italic" role="status">
        Nenhum evento registrado no momento.
      </div>
    );
  }

  const reversedData = [...data].reverse();

  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className="overflow-x-auto overflow-y-auto max-h-112"
        role="region"
        aria-label="Tabela de eventos de telemetria"
        tabIndex={0}
      >
        <table
          className="w-full text-left border-collapse"
          aria-label={`Logs de telemetria - ${data.length} eventos`}
        >
          <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm">
            <tr className="border-b border-slate-700 bg-slate-900/95 text-slate-400 text-xs uppercase tracking-wider">
              <th scope="col" className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Cpu size={14} aria-hidden="true" />
                  <span>Máquina</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Thermometer size={14} aria-hidden="true" />
                  <span>Temp.</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Waves size={14} aria-hidden="true" />
                  <span>Vibração (mm/s)</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Activity size={14} aria-hidden="true" />
                  <span>Status</span>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Clock size={14} aria-hidden="true" />
                  <span>Timestamp</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {reversedData.map((item, idx) => (
              <tr
                key={`${item.machine_id}-${idx}`}
                className="
                  group
                  hover:bg-slate-700/30
                  focus-within:bg-slate-700/40
                  transition-colors duration-150
                "
              >
                <td className="px-6 py-4">
                  <span
                    className="
                      font-mono text-sm text-emerald-400 
                      group-hover:text-emerald-300
                      transition-colors duration-150
                    "
                    title={item.machine_id}
                  >
                    {item.machine_id}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-200">
                  <span
                    aria-label={`${item.temperature.toFixed(1)} graus Celsius`}
                  >
                    {item.temperature.toFixed(1)}°C
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-200">
                  <span
                    aria-label={`${item.vibration_level.toFixed(2)} milímetros por segundo`}
                  >
                    {item.vibration_level.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadgeInline status={item.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <time
                    className="text-xs text-slate-400 font-mono"
                    dateTime={item.timestamp}
                  >
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
