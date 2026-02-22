import { Activity, Clock, Cpu, Thermometer } from "lucide-react";
import React from "react";
import type { Telemetry } from "../../App";

interface TableProps {
  data: Telemetry[];
  loading?: boolean;
}

export const TelemetryTable: React.FC<TableProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Carregando dados industriais...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 italic">
        Nenhum evento registrado no momento.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold flex items-center gap-2">
              <Cpu size={14} /> Máquina
            </th>
            <th className="px-6 py-4 font-semibold">
              <div className="flex items-center gap-2">
                <Thermometer size={14} /> Temp.
              </div>
            </th>
            <th className="px-6 py-4 font-semibold">
              <div className="flex items-center gap-2">
                <Activity size={14} /> Status
              </div>
            </th>
            <th className="px-6 py-4 font-semibold text-right">
              <div className="flex items-center gap-2 justify-end">
                <Clock size={14} /> Timestamp
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {[...data].reverse().map((item, idx) => (
            <tr
              key={`${item.machine_id}-${idx}`}
              className="hover:bg-slate-700/30 transition-colors group"
            >
              <td className="px-6 py-4">
                <span className="font-mono text-sm text-emerald-400 group-hover:text-emerald-300">
                  {item.machine_id.split("-")[0]}...
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium">
                {item.temperature.toFixed(1)}°C
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    item.status === "WARNING"
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
