import {
  Activity,
  AlertCircle,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useState } from "react";
import TelemetryChart from "./components/Chart";
import { FilterBar } from "./components/FilterBar";
import { MachineDetailModal } from "./components/MachineDetailModal";
import { MachineList } from "./components/MachineList";
import StatusChart from "./components/StatusChart";
import { TelemetryTable } from "./components/TelemetryTable";
import VibrationChart from "./components/VibrationChart";
import { useTelemetryQuery } from "./hooks/useTelemetryQuery";
import { useWebSocket } from "./hooks/useWebSocket";
import { useTelemetryStore } from "./store/useTelemetryStore";

export interface Telemetry {
  machine_id: string;
  temperature: number;
  vibration_level: number;
  status: string;
  timestamp: string;
}

const WS_URL = String(import.meta.env.VITE_WS_URL) || "";
const REST_URL = String(import.meta.env.VITE_REST_URL) || "";

function App() {
  const { addBatch, setConnected, connected } = useTelemetryStore();
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  );

  const { error: wsError, reconnect: handleWsReconnect } = useWebSocket<
    Telemetry[]
  >({
    url: WS_URL,
    enabled: true,
    onMessage: useCallback(
      (data: Telemetry[]) => {
        addBatch(data);
      },
      [addBatch],
    ),
    onConnect: useCallback(() => {
      setConnected(true);
    }, [setConnected]),
    onDisconnect: useCallback(() => {
      setConnected(false);
    }, [setConnected]),
  });

  const { isLoading, isError: restError, refetch } = useTelemetryQuery();

  const handleApplyFilters = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-slate-950 from-slate-900 via-slate-950 to-black text-slate-100 p-4 md:p-8">
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header
        className="max-w-8xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800/60 pb-6"
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

      <div className="max-w-8xl mx-auto">
        <FilterBar onApplyFilters={handleApplyFilters} />
      </div>

      {/* Erro de conexão REST API */}
      {restError && (
        <div className="max-w-8xl mx-auto mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <span className="text-red-400 font-medium">
                Não foi possível conectar com o servidor
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Erro de conexão WebSocket */}
      {wsError && (
        <div className="max-w-8xl mx-auto mb-6">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="text-orange-400" size={20} />
              <span className="text-orange-400 font-medium">{wsError}</span>
            </div>
            <button
              onClick={handleWsReconnect}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
            >
              <RefreshCw size={14} />
              Reconectar
            </button>
          </div>
        </div>
      )}

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
          className="max-w-8xl mx-auto grid grid-cols-12 gap-6"
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
            <div className="grid grid-rows-2 gap-6 h-full">
              <div className="min-h-70">
                <StatusChart />
              </div>
              <div className="min-h-70">
                <MachineList onSelectMachine={setSelectedMachineId} />
              </div>
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

      {/* Machine Detail Modal */}
      <MachineDetailModal
        machineId={selectedMachineId || ""}
        isOpen={!!selectedMachineId}
        onClose={() => setSelectedMachineId(null)}
        restUrl={REST_URL}
        wsUrl={WS_URL}
      />
    </div>
  );
}

export default App;
