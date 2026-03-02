import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { useTelemetryStore } from "../../store/useTelemetryStore";
import { Card } from "../Card";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusBadgeProps {
  label: string;
  count: number;
  status: "operational" | "warning" | "critical";
}

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-400",
    hoverBg: "hover:bg-emerald-500/20",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
    textClass: "text-orange-400",
    hoverBg: "hover:bg-orange-500/20",
  },
  critical: {
    icon: XCircle,
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    textClass: "text-red-400",
    hoverBg: "hover:bg-red-500/20",
  },
};

function StatusBadge({ label, count, status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-center justify-between gap-3 px-4 py-3
        rounded-lg border
        ${config.bgClass} ${config.borderClass} ${config.hoverBg}
        badge-interactive cursor-default
        transition-colors duration-200
      `}
      role="listitem"
      aria-label={`${label}: ${count} ${count === 1 ? "máquina" : "máquinas"}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className={config.textClass} aria-hidden="true" />
        <span className={`text-sm font-medium ${config.textClass}`}>
          {label}
        </span>
      </div>
      <span className={`text-lg font-bold ${config.textClass}`}>{count}</span>
    </div>
  );
}

export default function StatusChart() {
  const data = useTelemetryStore((state) => state.data);

  const chartData = useMemo(() => {
    const lastStatuses = data.reduce(
      (acc, curr) => {
        acc[curr.machine_id] = curr.status;
        return acc;
      },
      {} as Record<string, string>,
    );

    const statuses = Object.values(lastStatuses);
    const counts = {
      OPERATIONAL: 0,
      WARNING: 0,
      CRITICAL: 0,
    };

    statuses.forEach((s) => {
      if (s === "OPERATIONAL") counts.OPERATIONAL++;
      else if (s === "WARNING") counts.WARNING++;
      else if (s === "CRITICAL") counts.CRITICAL++;
    });

    const total = statuses.length;

    return {
      chart: {
        labels: ["Operacional", "Aviso", "Crítico"],
        datasets: [
          {
            data: [counts.OPERATIONAL, counts.WARNING, counts.CRITICAL],
            backgroundColor: ["#10b981", "#fb923c", "#ef4444"],
            borderWidth: 0,
          },
        ],
      },
      total,
      counts,
    };
  }, [data]);

  return (
    <Card
      padding="md"
      className="h-full flex flex-col"
      role="region"
      aria-label="Status da frota de máquinas"
    >
      <h3 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">
        Status da Frota
      </h3>

      <p className="sr-only">
        Resumo do status da frota: {chartData.counts.OPERATIONAL} máquinas
        operacionais,
        {chartData.counts.WARNING} em alerta, {chartData.counts.CRITICAL} em
        estado crítico. Total de {chartData.total} máquinas monitoradas.
      </p>

      <div
        className="w-full max-w-48 mx-auto flex-1 min-h-40"
        role="img"
        aria-label={`Gráfico de rosca mostrando distribuição de status: ${chartData.counts.OPERATIONAL} operacionais, ${chartData.counts.WARNING} em alerta, ${chartData.counts.CRITICAL} críticos`}
      >
        <Doughnut
          data={chartData.chart}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || "";
                    const value = context.parsed || 0;
                    const percentage =
                      chartData.total > 0
                        ? ((value / chartData.total) * 100).toFixed(1)
                        : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
          }}
        />
      </div>

      <div
        className="mt-6 space-y-2"
        role="list"
        aria-label="Lista de status das máquinas"
      >
        <StatusBadge
          label="Operacional"
          count={chartData.counts.OPERATIONAL}
          status="operational"
        />
        <StatusBadge
          label="Alerta"
          count={chartData.counts.WARNING}
          status="warning"
        />
        <StatusBadge
          label="Crítico"
          count={chartData.counts.CRITICAL}
          status="critical"
        />
      </div>
    </Card>
  );
}
