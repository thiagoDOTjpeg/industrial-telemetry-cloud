import type { ChartData, ChartOptions } from "chart.js";
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
import { Thermometer } from "lucide-react";
import React from "react";
import { Line } from "react-chartjs-2";
import type { Telemetry } from "../../App";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface ChartProps {
  data: Telemetry[];
}

export const TelemetryChart: React.FC<ChartProps> = ({ data }) => {
  const chartData: ChartData<"line"> = {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Temperatura (°C)",
        data: data.map((d) => d.temperature),
        borderColor: "#fb923c",
        backgroundColor: "rgba(251, 146, 60, 0.5)",
        borderWidth: 3,
        tension: 0.3,
        pointRadius: data.length > 30 ? 0 : 3,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: "#94a3b8", maxRotation: 0 },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#334155" },
        suggestedMin: 20,
        suggestedMax: 80,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { color: "#f1f5f9", font: { size: 12 } },
      },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Thermometer size={20} className="text-orange-400" /> Monitoramento
          Térmico
        </h2>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Sensor: 01 / Real-time
        </span>
      </div>
      <div className="h-80 lg:h-100 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
