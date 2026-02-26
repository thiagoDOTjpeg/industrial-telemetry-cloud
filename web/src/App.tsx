import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Activity, Database, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef } from "react";
import TelemetryChart from "./components/Chart";
import StatusChart from "./components/StatusChart";
import { TelemetryTable } from "./components/TelemetryTable";
import VibrationChart from "./components/VibrationChart";
import { useTelemetryStore } from "./store/useTelemetryStore";

export interface Telemetry {
  machine_id: string;
  temperature: number;
  vibration_level: number;
  status: string;
  timestamp: string;
}

const REST_URL = `http://athens.gritti.dev.br:4566/restapis/q7xfd3s42i/dev/_user_request_/telemetry`;
const WS_URL = `ws://athens.gritti.dev.br:4510/dev`;

function App() {
  const { setInitialData, addBatch, setConnected, connected } =
    useTelemetryStore();
  const ws = useRef<WebSocket | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["telemetry-history"],
    queryFn: async () => {
      const res = await axios.get(REST_URL);
      const history = (res.data as Telemetry[]).reverse();
      setInitialData(history);
      return history;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onmessage = (event) => addBatch(JSON.parse(event.data));
    socket.onclose = () => setConnected(false);
    return () => socket.close();
  }, [addBatch, setConnected]);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 p-4 md:p-8">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header
        className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800/60 pb-6"
        role="banner"
        aria-label="Cabeçalho do sistema de monitoramento"
      >
        <div className="flex items-center gap-4">
          <div
            className="bg-emerald-500/10 p-3 rounded-xl transition-transform duration-200 hover:scale-105"
            aria-hidden="true"
          >
            <Activity className="text-emerald-400" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Industrial Cloud
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider">
              SISTEMA DE MONITORAMENTO V3
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold 
              transition-all duration-200
              focus-ring
              ${
                connected
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
              }
            `}
            role="status"
            aria-live="polite"
            aria-label={
              connected ? "Conexão ativa em tempo real" : "Conexão perdida"
            }
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
              aria-hidden="true"
            />
            {connected ? (
              <Wifi size={14} aria-hidden="true" />
            ) : (
              <WifiOff size={14} aria-hidden="true" />
            )}
            <span>{connected ? "LIVE" : "OFFLINE"}</span>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div
          className="h-[60vh] flex flex-col items-center justify-center gap-4"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="w-12 h-12 border-4 border-slate-800 border-t-emerald-400 rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-slate-500 font-medium animate-pulse">
            Sincronizando ativos...
          </p>
          <span className="sr-only">Carregando dados de telemetria</span>
        </div>
      ) : (
        <main
          id="main-content"
          className="max-w-7xl mx-auto grid grid-cols-12 gap-6"
          role="main"
          aria-label="Painel de monitoramento de telemetria"
        >
          <section
            className="col-span-12 lg:col-span-3"
            aria-labelledby="status-heading"
          >
            <h2 id="status-heading" className="sr-only">
              Status da Frota
            </h2>
            <div className="h-full">
              <StatusChart />
            </div>
          </section>

          <div className="col-span-12 lg:col-span-9 space-y-6">
            <section
              className="
                bg-slate-900/40 backdrop-blur-sm p-1 rounded-2xl border border-slate-800/50
                transition-all duration-200
                hover:border-slate-700/60 hover:shadow-lg
              "
              aria-labelledby="temperature-heading"
            >
              <h2 id="temperature-heading" className="sr-only">
                Monitoramento Térmico
              </h2>
              <TelemetryChart />
            </section>

            <section
              className="
                bg-slate-900/40 backdrop-blur-sm p-1 rounded-2xl border border-slate-800/50
                transition-all duration-200
                hover:border-slate-700/60 hover:shadow-lg
              "
              aria-labelledby="vibration-heading"
            >
              <h2 id="vibration-heading" className="sr-only">
                Monitoramento de Vibração
              </h2>
              <VibrationChart />
            </section>
          </div>

          <section className="col-span-12 mt-4" aria-labelledby="logs-heading">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Database size={18} aria-hidden="true" />
              <h2
                id="logs-heading"
                className="text-sm font-bold uppercase tracking-widest"
              >
                Logs de Eventos Brutos
              </h2>
            </div>
            <div
              className="
                max-h-112 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/50 
                overflow-hidden
                transition-all duration-200
                hover:border-slate-700/60 hover:shadow-lg
              "
            >
              <TelemetryTable />
            </div>
          </section>
        </main>
      )}

      <footer
        className="max-w-7xl mx-auto mt-12 pb-8 text-center"
        role="contentinfo"
      >
        <p className="text-slate-600 text-xs uppercase tracking-widest">
          &copy; 2026 Industrial Telemetry System &bull; Localstack Environment
        </p>
      </footer>
    </div>
  );
}

export default App;
