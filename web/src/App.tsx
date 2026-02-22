import axios from "axios";
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
import { Activity, Database, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TelemetryChart } from "./components/Chart";
import { TelemetryTable } from "./components/Table";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export interface Telemetry {
  machine_id: string;
  temperature: number;
  status: string;
  timestamp: string;
}

const REST_API_ID = "gd6yflxwmr";
const WS_PORT = "4511";
const REST_URL = `http://athens.gritti.dev.br:4566/restapis/${REST_API_ID}/dev/_user_request_/telemetry`;
const WS_URL = `ws://athens.gritti.dev.br:${WS_PORT}/dev`;

function App() {
  const [data, setData] = useState<Telemetry[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const response = await axios.get(REST_URL);
        if (isMounted && response.data) {
          setData((response.data as Telemetry[]).reverse());
        }
      } catch (error) {
        console.error("Falha no histórico:", error);
      }
    };

    fetchInitialData();

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => isMounted && setConnected(true);
    socket.onmessage = (event) => {
      if (isMounted) {
        console.log(event.data);
        const batch = JSON.parse(event.data) as Telemetry[];
        setData((prev) => [...prev, ...batch].slice(-50));
      }
    };
    socket.onclose = () => isMounted && setConnected(false);

    return () => {
      isMounted = false;
      socket.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-emerald-400" /> Industrial Dashboard v2
        </h1>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${connected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          <Wifi size={14} className="inline mr-1" />{" "}
          {connected ? "LIVE" : "DISCONNECTED"}
        </span>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TelemetryChart data={data} />
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-120 lg:h-150 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="text-blue-400" /> Live Stream
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <TelemetryTable data={data} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
