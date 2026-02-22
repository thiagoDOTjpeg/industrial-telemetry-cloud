import { Line } from "react-chartjs-2";
import { useTelemetryStore } from "../../store/useTelemetryStore";

export default function VibrationChart() {
  const data = useTelemetryStore((state) => state.data);

  const chartData = {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Nível de Vibração (mm/s)",
        data: data.map((d) => d.vibration_level),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
        Monitoramento de Vibração
      </h3>
      <div className="h-62.5">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: { x: { display: false } },
          }}
        />
      </div>
    </div>
  );
}
