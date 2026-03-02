import { Waves } from "lucide-react";
import { Line } from "react-chartjs-2";
import { useTelemetryStore } from "../../store/useTelemetryStore";
import { chartColors } from "../../styles/chartColors";
import { Card } from "../Card";

export default function VibrationChart() {
  const data = useTelemetryStore((state) => state.data);

  const chartData = {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Nível de Vibração (mm/s)",
        data: data.map((d) => d.vibration_level),
        borderColor: chartColors.vibration,
        backgroundColor: chartColors.vibrationFill,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const avgVibration =
    data.length > 0
      ? (
          data.reduce((sum, d) => sum + d.vibration_level, 0) / data.length
        ).toFixed(2)
      : 0;
  const latestVibration =
    data.length > 0 ? data[data.length - 1].vibration_level.toFixed(2) : 0;

  return (
    <Card
      padding="md"
      className="h-full"
      role="region"
      aria-label="Gráfico de monitoramento de vibração"
    >
      <div className="flex items-center gap-2 mb-4">
        <Waves size={18} className="text-sky-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Monitoramento de Vibração
        </h3>
      </div>

      <p className="sr-only">
        Gráfico de área mostrando níveis de vibração ao longo do tempo.
        {data.length > 0
          ? ` Vibração média: ${avgVibration} mm/s. Última leitura: ${latestVibration} mm/s.`
          : " Sem dados disponíveis."}
      </p>

      <div
        className="h-64"
        role="img"
        aria-label={`Gráfico de vibração com ${data.length} pontos de dados`}
      >
        {data.length === 0 ? (
          <div
            className="flex items-center justify-center h-full text-slate-400"
            role="status"
          >
            <p>Nenhuma informação coletada até o momento!</p>
          </div>
        ) : (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              scales: {
                x: { display: false },
                y: {
                  ticks: { color: chartColors.tick },
                  grid: { color: chartColors.grid },
                },
              },
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: {
                    color: chartColors.textPrimary,
                    font: { size: 12 },
                  },
                },
              },
            }}
          />
        )}
      </div>
    </Card>
  );
}
