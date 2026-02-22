import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTelemetryStore } from "../../store/useTelemetryStore";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatusChart() {
  const data = useTelemetryStore((state) => state.data);

  const lastStatuses = data.reduce(
    (acc, curr) => {
      acc[curr.machine_id] = curr.status;
      return acc;
    },
    {} as Record<string, string>,
  );

  const counts = {
    OPERATIONAL: Object.values(lastStatuses).filter((s) => s === "OPERATIONAL")
      .length,
    WARNING: Object.values(lastStatuses).filter((s) => s === "WARNING").length,
    CRITICAL: Object.values(lastStatuses).filter((s) => s === "CRITICAL")
      .length,
  };

  const chartData = {
    labels: ["Operacional", "Aviso", "Crítico"],
    datasets: [
      {
        data: [counts.OPERATIONAL, counts.WARNING, counts.CRITICAL],
        backgroundColor: ["#10b981", "#fb923c", "#ef4444"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 self-start uppercase tracking-wider">
        Status da Frota
      </h3>
      <div className="w-full max-w-50 flex-1">
        <Doughnut
          data={chartData}
          options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
          }}
        />
      </div>
    </div>
  );
}
