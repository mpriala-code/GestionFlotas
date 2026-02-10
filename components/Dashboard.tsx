
import React from 'react';
import { Truck, Users, HardHat, Fuel, TrendingUp, AlertCircle, ChevronRight, ClipboardList } from 'lucide-react';
import { Vehicle, Worker, Work, LogEntry, PriceRecord } from '../types';
import { Alert } from '../App';

interface DashboardProps {
  vehicles: Vehicle[];
  workers: Worker[];
  works: Work[];
  logs: LogEntry[];
  alerts: Alert[];
  priceHistory: PriceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ vehicles, workers, works, logs, alerts, priceHistory }) => {
  const stats = [
    { label: 'Vehículos', value: vehicles.length, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Trabajadores', value: workers.length, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Obras Activas', value: works.filter(w => w.status === 'Activa').length, icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Alertas Totales', value: alerts.length, icon: AlertCircle, color: alerts.some(a => a.type === 'danger') ? 'text-red-500' : 'text-yellow-500', bg: alerts.some(a => a.type === 'danger') ? 'bg-red-500/10' : 'bg-yellow-500/10' },
  ];

  // Logic to find applicable price for a date supporting intervals
  const getPriceForDate = (date: string) => {
    // 1. Find exact interval matches
    const applicable = priceHistory.filter(p => {
      const startsBefore = p.date <= date;
      const endsAfter = !p.endDate || p.endDate >= date;
      return startsBefore && endsAfter;
    });

    if (applicable.length > 0) {
      // Pick the one with the most recent start date
      return applicable.sort((a, b) => b.date.localeCompare(a.date))[0];
    }

    // 2. Fallback: Find the latest one that starts before the date regardless of endDate
    const fallback = [...priceHistory]
      .filter(p => p.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    return fallback || priceHistory[priceHistory.length - 1];
  };

  const totalCost = logs.reduce((acc, log) => {
    const price = getPriceForDate(log.date);
    return acc + (log.fuelConsumed * price.fuelPrice) + (log.distance * price.costPerKm);
  }, 0);

  const totalFuel = logs.reduce((acc, log) => acc + log.fuelConsumed, 0).toFixed(1);
  const totalDist = logs.reduce((acc, log) => acc + log.distance, 0);

  const activePrice = priceHistory[0]; // Assuming sorted desc in state

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-3xl font-bold group-hover:scale-110 transition-transform">{stat.value}</span>
            </div>
            <p className="text-slate-400 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Actividad Reciente
            </h3>
            <span className="text-sm text-slate-400">Últimos viajes registrados</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Trayecto</th>
                  <th className="px-6 py-4 font-medium">Vehículo</th>
                  <th className="px-6 py-4 font-medium">Km</th>
                  <th className="px-6 py-4 font-medium text-right">Consumo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.slice(-5).reverse().map((log) => {
                  const v = vehicles.find(v => v.id === log.vehicleId);
                  const w = workers.find(w => w.id === log.workerId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-slate-200 font-medium">{log.tripType}</div>
                        <div className="text-[10px] text-slate-500">{log.date} • {w?.name}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-400">{v?.plate}</td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          {log.distance} <span className="text-[10px] text-slate-500">km</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-green-400 font-bold">{log.fuelConsumed}L</span>
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No hay actividad reciente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Consumption Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-purple-500" />
            Resumen Global
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-slate-400 text-sm">Total Combustible</span>
                <span className="text-2xl font-bold text-purple-400">{totalFuel} L</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-slate-400 text-sm">Gasto Estimado</span>
                <span className="text-2xl font-bold text-green-400">{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[80%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">Basado en precios dinámicos por fecha.</p>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-bold">{totalDist.toLocaleString()} km totales</span>
              </div>
              <p className="text-xs text-slate-500 italic">Última tarifa: {activePrice?.fuelPrice.toFixed(3)}€/L</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
