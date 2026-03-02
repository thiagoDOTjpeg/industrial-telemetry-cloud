import type { ChartOptions } from "chart.js";
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
import { Line } from "react-chartjs-2";
import { useTelemetryStore } from "../../store/useTelemetryStore";
import { chartColors } from "../../styles/chartColors";
import { Card } from "../Card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function TelemetryChart() {
  const data = useTelemetryStore((state) => state.data);

  const chartData = {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Temperatura (°C)",
        data: data.map((d) => d.temperature),
        borderColor: chartColors.temperature,
        backgroundColor: chartColors.temperatureFill,
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
        ticks: { color: chartColors.tick, maxRotation: 0 },
      },
      y: {
        ticks: { color: chartColors.tick },
        grid: { color: chartColors.grid },
        suggestedMin: 20,
        suggestedMax: 80,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { color: chartColors.textPrimary, font: { size: 12 } },
      },
      tooltip: { enabled: true },
    },
  };

  const avgTemp =
    data.length > 0
      ? (data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(
          1,
        )
      : 0;
  const latestTemp =
    data.length > 0 ? data[data.length - 1].temperature.toFixed(1) : 0;

  return (
    <Card
      padding="md"
      className="min-w-0"
      role="region"
      aria-label="Gráfico de monitoramento térmico"
    >
      <div className="flex justify-between items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Thermometer
            size={20}
            className="text-orange-400 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <span>Monitoramento Térmico</span>
        </h2>
        <span
          className="text-xs font-mono text-slate-500 uppercase tracking-widest"
          aria-label="Identificador do sensor"
        >
          Sensor: 01 / Real-time
        </span>
      </div>

      <p className="sr-only">
        Gráfico de linha mostrando temperatura ao longo do tempo.
        {data.length > 0
          ? `Temperatura média: ${avgTemp}°C. Última leitura: ${latestTemp}°C.`
          : "Sem dados disponíveis."}
      </p>

      <div
        className="h-80 lg:h-96 w-full"
        role="img"
        aria-label={`Gráfico de temperatura com ${data.length} pontos de dados`}
      >
        {data.length === 0 ? (
          <div
            className="flex items-center justify-center h-full text-slate-400"
            role="status"
          >
            <p>Nenhuma informação coletada até o momento!</p>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </Card>
  );
}
