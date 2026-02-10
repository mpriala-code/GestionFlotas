
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  TrendingUp, Fuel, Ruler, Wallet, User, HardHat, Truck, Navigation, 
  ArrowUpRight, ArrowDownRight, Zap, Target, FileDown
} from 'lucide-react';
import { LogEntry, Vehicle, Worker, Work, TripType, PriceRecord } from '../types';

declare const XLSX: any;

interface StatsProps {
  logs: LogEntry[];
  vehicles: Vehicle[];
  workers: Worker[];
  works: Work[];
  priceHistory: PriceRecord[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

type StatsView = 'global' | 'workers' | 'works' | 'vehicles';

const Stats: React.FC<StatsProps> = ({ logs, vehicles, workers, works, priceHistory }) => {
  const [view, setView] = useState<StatsView>('global');

  // Logic to find applicable price for a date supporting intervals
  const getPriceForDate = (date: string) => {
    const applicable = priceHistory.filter(p => {
      const startsBefore = p.date <= date;
      const endsAfter = !p.endDate || p.endDate >= date;
      return startsBefore && endsAfter;
    });

    if (applicable.length > 0) {
      return applicable.sort((a, b) => b.date.localeCompare(a.date))[0];
    }

    const fallback = [...priceHistory]
      .filter(p => p.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    return fallback || priceHistory[priceHistory.length - 1];
  };

  // Basic Calculations
  const totals = useMemo(() => {
    const totalKm = logs.reduce((acc, l) => acc + l.distance, 0);
    const totalFuel = logs.reduce((acc, l) => acc + l.fuelConsumed, 0);
    const totalCost = logs.reduce((acc, l) => {
      const price = getPriceForDate(l.date);
      return acc + (l.fuelConsumed * price.fuelPrice) + (l.distance * price.costPerKm);
    }, 0);
    const avgConsumption = totalKm > 0 ? (totalFuel / totalKm) * 100 : 0;
    
    return { totalKm, totalFuel, totalCost, avgConsumption };
  }, [logs, priceHistory]);

  // Data for Charts
  const dailyData = useMemo(() => {
    const dataByDate: Record<string, { date: string, consumption: number, distance: number, cost: number }> = {};
    logs.forEach(log => {
      if (!dataByDate[log.date]) {
        dataByDate[log.date] = { date: log.date, consumption: 0, distance: 0, cost: 0 };
      }
      const price = getPriceForDate(log.date);
      dataByDate[log.date].consumption += log.fuelConsumed;
      dataByDate[log.date].distance += log.distance;
      dataByDate[log.date].cost += (log.fuelConsumed * price.fuelPrice) + (log.distance * price.costPerKm);
    });
    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, priceHistory]);

  const workerStats = useMemo(() => {
    const stats: Record<string, { name: string, distance: number, fuel: number, cost: number, count: number }> = {};
    logs.forEach(log => {
      const w = workers.find(w => w.id === log.workerId);
      const name = w ? w.name : 'Desconocido';
      if (!stats[name]) stats[name] = { name, distance: 0, fuel: 0, cost: 0, count: 0 };
      const price = getPriceForDate(log.date);
      stats[name].distance += log.distance;
      stats[name].fuel += log.fuelConsumed;
      stats[name].cost += (log.fuelConsumed * price.fuelPrice) + (log.distance * price.costPerKm);
      stats[name].count += 1;
    });
    return Object.values(stats).sort((a, b) => b.distance - a.distance);
  }, [logs, workers, priceHistory]);

  const workStats = useMemo(() => {
    const stats: Record<string, { name: string, distance: number, fuel: number, cost: number }> = {};
    logs.forEach(log => {
      const o = works.find(o => o.id === log.workId);
      const name = o ? o.name : 'Sin Obra';
      if (!stats[name]) stats[name] = { name, distance: 0, fuel: 0, cost: 0 };
      const price = getPriceForDate(log.date);
      stats[name].distance += log.distance;
      stats[name].fuel += log.fuelConsumed;
      stats[name].cost += (log.fuelConsumed * price.fuelPrice) + (log.distance * price.costPerKm);
    });
    return Object.values(stats).sort((a, b) => b.cost - a.cost);
  }, [logs, works, priceHistory]);

  const tripTypeStats = useMemo(() => {
    const stats: Record<string, { name: string, value: number, km: number }> = {};
    logs.forEach(log => {
      if (!stats[log.tripType]) stats[log.tripType] = { name: log.tripType, value: 0, km: 0 };
      stats[log.tripType].value += 1;
      stats[log.tripType].km += log.distance;
    });
    return Object.values(stats);
  }, [logs]);

  // EXPORT COMPLETE STATS REPORT
  const handleExportStats = () => {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Totals
    const totalsWs = XLSX.utils.json_to_sheet([{
      'KM Totales': totals.totalKm,
      'Litros Totales': totals.totalFuel,
      'Coste Real Total (€)': totals.totalCost,
      'Media Consumo (L/100)': totals.avgConsumption
    }]);
    XLSX.utils.book_append_sheet(wb, totalsWs, "Resumen General");

    // 2. Worker Stats
    const workerWs = XLSX.utils.json_to_sheet(workerStats.map(w => ({
      'Trabajador': w.name,
      'Viajes': w.count,
      'KM Totales': w.distance,
      'Litros Totales': w.fuel,
      'Coste Real (€)': w.cost,
      'Media Consumo': w.distance > 0 ? (w.fuel/w.distance)*100 : 0
    })));
    XLSX.utils.book_append_sheet(wb, workerWs, "Por Trabajador");

    // 3. Work Stats
    const workWs = XLSX.utils.json_to_sheet(workStats.map(o => ({
      'Obra': o.name,
      'KM Totales': o.distance,
      'Litros Totales': o.fuel,
      'Coste Real (€)': o.cost
    })));
    XLSX.utils.book_append_sheet(wb, workWs, "Por Obra");

    // 4. Vehicle Stats (Simplified from vehicles list)
    const vehicleSummary = vehicles.map(v => {
      const vLogs = logs.filter(l => l.vehicleId === v.id);
      const vKm = vLogs.reduce((acc, l) => acc + l.distance, 0);
      const vFuel = vLogs.reduce((acc, l) => acc + l.fuelConsumed, 0);
      return {
        'Matrícula': v.plate,
        'Modelo': v.model,
        'KM Actuales': v.kilometers,
        'KM en Periodo': vKm,
        'Litros en Periodo': vFuel,
        'Consumo Medio Real': vKm > 0 ? (vFuel/vKm)*100 : 0
      };
    });
    const vehicleWs = XLSX.utils.json_to_sheet(vehicleSummary);
    XLSX.utils.book_append_sheet(wb, vehicleWs, "Por Vehiculo");

    XLSX.writeFile(wb, `Informe_Flota_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Análisis de Inteligencia
          </h2>
          <p className="text-slate-400 text-sm">Informes detallados con precios históricos dinámicos</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportStats}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-xs"
          >
            <FileDown className="w-4 h-4" />
            Exportar Informe Completo
          </button>
          <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            {[
              { id: 'global', label: 'Global', icon: Zap },
              { id: 'workers', label: 'Personal', icon: User },
              { id: 'works', label: 'Obras', icon: HardHat },
              { id: 'vehicles', label: 'Flota', icon: Truck }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setView(btn.id as StatsView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  view === btn.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <btn.icon className="w-3.5 h-3.5" />
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Ruler className="w-6 h-6 text-blue-500" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-green-500 opacity-50" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Distancia Total</p>
          <p className="text-2xl font-bold">{totals.totalKm.toLocaleString()} <span className="text-sm font-normal text-slate-400">km</span></p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Fuel className="w-6 h-6 text-green-500" />
            </div>
            <ArrowDownRight className="w-4 h-4 text-red-500 opacity-50" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Combustible</p>
          <p className="text-2xl font-bold">{totals.totalFuel.toLocaleString()} <span className="text-sm font-normal text-slate-400">L</span></p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Wallet className="w-6 h-6 text-purple-500" />
            </div>
            <TrendingUp className="w-4 h-4 text-blue-500 opacity-50" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Gasto Real Histórico</p>
          <p className="text-2xl font-bold">{totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-400">€</span></p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Target className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">Meta: 8.5</span>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Eficiencia Flota</p>
          <p className="text-2xl font-bold">{totals.avgConsumption.toFixed(2)} <span className="text-sm font-normal text-slate-400">L/100</span></p>
        </div>
      </div>

      {/* Dynamic Views */}
      {view === 'global' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Evolución Gasto Real (€)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)}€`, 'Gasto']}
                  />
                  <Area type="monotone" dataKey="cost" name="Coste" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-500" />
              Distribución de Trayectos
            </h3>
            <div className="h-80 flex flex-col sm:flex-row items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tripTypeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tripTypeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {view === 'workers' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="font-bold">Gasto Real por Trabajador</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/30 text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Trabajador</th>
                    <th className="px-6 py-4">Viajes</th>
                    <th className="px-6 py-4">Kilómetros</th>
                    <th className="px-6 py-4">Litros</th>
                    <th className="px-6 py-4 text-right">Coste Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {workerStats.map((w, i) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold">{w.name}</td>
                      <td className="px-6 py-4 text-slate-400">{w.count}</td>
                      <td className="px-6 py-4 text-blue-400 font-medium">{w.distance.toLocaleString()} km</td>
                      <td className="px-6 py-4 text-green-400 font-medium">{w.fuel.toFixed(1)} L</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-200">{w.cost.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'works' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-6">Gasto por Obra (€)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={10} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: '#1e293b'}}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Bar dataKey="cost" name="Coste (€)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl overflow-hidden">
              <h3 className="text-lg font-bold mb-6">Desglose de Costes por Proyecto</h3>
              <div className="space-y-4">
                {workStats.map((work, idx) => (
                  <div key={idx} className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition-all">
                    <div>
                      <p className="font-bold text-slate-200">{work.name}</p>
                      <p className="text-xs text-slate-500">{work.distance} km acumulados</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-400">{work.cost.toFixed(2)}€</p>
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full" 
                          style={{ width: `${(work.cost / totals.totalCost) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Insight */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-slate-700 p-8 rounded-3xl text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <Zap className="w-10 h-10 text-yellow-400 mx-auto" />
          <h4 className="text-xl font-bold">Análisis de Costes Dinámicos</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            El sistema ha calculado un gasto total de <span className="text-white font-bold">{totals.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}€</span> aplicando las tarifas vigentes en el periodo de cada viaje. 
            Esta metodología permite que tu contabilidad sea exacta independientemente de si el gasoil varía según el intervalo de tiempo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
