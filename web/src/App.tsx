import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Activity, Wifi } from "lucide-react";
import { useEffect, useRef } from "react";
import TelemetryChart from "./components/Chart";
import { TelemetryTable } from "./components/Table";
import { useTelemetryStore } from "./store/useTelemetryStore";

export interface Telemetry {
  machine_id: string;
  temperature: number;
  status: string;
  timestamp: string;
}

const REST_URL = `http://athens.gritti.dev.br:4566/restapis/gd6yflxwmr/dev/_user_request_/telemetry`;
const WS_URL = `ws://athens.gritti.dev.br:4511/dev`;

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
    socket.onmessage = (event) => {
      const batch = JSON.parse(event.data);
      addBatch(batch);
    };
    socket.onclose = () => setConnected(false);

    return () => socket.close();
  }, [addBatch, setConnected]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-emerald-400" /> Industrial Cloud v3
        </h1>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${connected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          <Wifi size={14} className="inline mr-1" />{" "}
          {connected ? "LIVE" : "DISCONNECTED"}
        </span>
      </header>

      {isLoading ? (
        <div className="animate-pulse text-slate-500 text-center">
          Sincronizando com a nuvem...
        </div>
      ) : (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TelemetryChart />
          </div>
          <div className="h-125 overflow-hidden flex flex-col">
            <TelemetryTable />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
