import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Activity, Database, Wifi } from "lucide-react";
import { useEffect, useRef } from "react";
import TelemetryChart from "./components/Chart";
import StatusChart from "./components/StatusChart";
import { TelemetryTable } from "./components/Table";
import VibrationChart from "./components/VibrationChart";
import { useTelemetryStore } from "./store/useTelemetryStore";

export interface Telemetry {
  machine_id: string;
  temperature: number;
  vibration_level: number;
  status: string;
  timestamp: string;
}

const REST_URL = `http://athens.gritti.dev.br:4566/restapis/xa90ncrdx7/dev/_user_request_/telemetry`;
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
      <header className="max-w-400 mx-auto flex justify-between items-center mb-8 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <Activity className="text-emerald-400" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Industrial Cloud
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              SISTEMA DE MONITORAMENTO V3
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              connected
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
            />
            <Wifi size={14} />
            {connected ? "LIVE STREAMING" : "CONNECTION LOST"}
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">
            Sincronizando ativos...
          </p>
        </div>
      ) : (
        <main className="max-w-400 mx-auto grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="h-full">
              <StatusChart />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-6">
            <section className="bg-slate-900/40 backdrop-blur-sm p-1 rounded-2xl border border-slate-800/50">
              <TelemetryChart />
            </section>
            <section className="bg-slate-900/40 backdrop-blur-sm p-1 rounded-2xl border border-slate-800/50">
              <VibrationChart />
            </section>
          </div>

          <div className="col-span-12 mt-4">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <Database size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">
                Logs de Eventos Brutos
              </h2>
            </div>
            <div className="h-112.5 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
              <TelemetryTable />
            </div>
          </div>
        </main>
      )}

      <footer className="max-w-400 mx-auto mt-12 pb-8 text-center">
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          &copy; 2026 Industrial Telemetry System &bull; Localstack Environment
        </p>
      </footer>
    </div>
  );
}

export default App;
