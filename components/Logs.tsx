
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Fuel, 
  Ruler, 
  Trash2, 
  Navigation, 
  User, 
  ChevronRight, 
  History,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  Info,
  Fingerprint
} from 'lucide-react';
import { LogEntry, Vehicle, Worker, Work, TripType } from '../types';

interface LogsProps {
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  workers: Worker[];
  works: Work[];
  isAdmin: boolean;
  currentUser: Worker | null;
}

const Logs: React.FC<LogsProps> = ({ logs, setLogs, vehicles, setVehicles, workers, works, isAdmin, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<LogEntry>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    vehicleId: '',
    workerId: currentUser?.id || '',
    workId: '',
    tripType: TripType.WORKS,
    startKm: 0,
    endKm: 0,
    distance: 0,
    fuelConsumed: 0,
    avgConsumption: 0,
    notes: ''
  });

  // Auto-fill worker if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, workerId: currentUser.id }));
    }
  }, [currentUser]);

  // Calculate global summary
  const summary = useMemo(() => {
    return logs.reduce((acc, log) => ({
      totalKm: acc.totalKm + log.distance,
      totalFuel: acc.totalFuel + log.fuelConsumed,
      count: acc.count + 1
    }), { totalKm: 0, totalFuel: 0, count: 0 });
  }, [logs]);

  // odometer update
  useEffect(() => {
    if (formData.vehicleId) {
      const v = vehicles.find(v => v.id === formData.vehicleId);
      if (v) {
        setFormData(prev => ({ 
          ...prev, 
          startKm: v.kilometers,
          endKm: (prev.endKm === undefined || prev.endKm < v.kilometers) ? v.kilometers : prev.endKm 
        }));
      }
    }
  }, [formData.vehicleId, vehicles]);

  // distance update
  useEffect(() => {
    if (formData.vehicleId && formData.startKm !== undefined && formData.endKm !== undefined) {
      const v = vehicles.find(v => v.id === formData.vehicleId);
      if (v) {
        const distance = formData.endKm - formData.startKm;
        if (distance >= 0) {
          const adjustedConsumption = v.baseConsumption * (1 + v.wearFactor / 100);
          const fuel = (distance / 100) * adjustedConsumption;
          setFormData(prev => ({ 
            ...prev, 
            distance, 
            fuelConsumed: Number(fuel.toFixed(2)),
            avgConsumption: Number(adjustedConsumption.toFixed(2))
          }));
        } else {
          setFormData(prev => ({ ...prev, distance: 0, fuelConsumed: 0, avgConsumption: 0 }));
        }
      }
    }
  }, [formData.startKm, formData.endKm, formData.vehicleId, vehicles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.workerId || (formData.distance || 0) < 0) {
      alert("Por favor, rellena todos los campos obligatorios.");
      return;
    }

    const newLog = {
      ...formData as LogEntry,
      id: Math.random().toString(36).substr(2, 9),
    };

    setLogs(prev => [...prev, newLog]);
    setVehicles(prev => prev.map(v => 
      v.id === formData.vehicleId ? { ...v, kilometers: formData.endKm || v.kilometers } : v
    ));

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      vehicleId: '',
      workerId: currentUser?.id || '',
      workId: '',
      tripType: TripType.WORKS,
      startKm: 0,
      endKm: 0,
      distance: 0,
      fuelConsumed: 0,
      avgConsumption: 0,
      notes: ''
    });
  };

  const deleteLog = (id: string) => {
    if (confirm('¿Eliminar este registro?')) {
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-blue-500" />
            Registros de Actividad
          </h2>
          <p className="text-slate-400 text-sm">Control diario de trayectos y consumos</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Nuevo Registro
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Viajes Totales</p>
          <p className="text-2xl font-bold text-slate-200">{summary.count}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Km Totales</p>
          <p className="text-2xl font-bold text-blue-400">{summary.totalKm.toLocaleString()} km</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Gasoil Estimado</p>
          <p className="text-2xl font-bold text-green-400">{summary.totalFuel.toFixed(1)} L</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                <th className="px-6 py-4 font-medium">Vehículo</th>
                <th className="px-6 py-4 font-medium">Conductor / Obra</th>
                <th className="px-6 py-4 font-medium">Kilometraje</th>
                <th className="px-6 py-4 font-medium text-right">Consumo</th>
                {isAdmin && <th className="px-6 py-4 font-medium text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.slice().sort((a,b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).map(log => {
                const v = vehicles.find(v => v.id === log.vehicleId);
                const w = workers.find(w => w.id === log.workerId);
                const o = works.find(o => o.id === log.workId);
                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {log.date}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {log.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-400">{v?.plate || 'S/M'}</div>
                      <div className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-1 font-bold uppercase tracking-wider ${
                        log.tripType === TripType.PERSONAL ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.tripType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="font-medium text-slate-300">{w?.name || 'Desconocido'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{o?.name || 'Ruta libre'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>{log.startKm}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{log.endKm}</span>
                      </div>
                      <div className="font-bold text-slate-200 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        {log.distance} km
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-green-400 text-base">{log.fuelConsumed} L</div>
                      <div className="text-[10px] text-slate-500 font-medium">({log.avgConsumption} L/100km)</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => deleteLog(log.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500 italic">No hay registros de viajes todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl my-auto animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-3xl">
              <h2 className="text-xl font-bold">Registrar Nuevo Viaje</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fecha</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hora</label>
                  <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 outline-none" />
                </div>
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tipo</label>
                  <select required value={formData.tripType} onChange={e => setFormData({...formData, tripType: e.target.value as TripType})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 outline-none">
                    {Object.values(TripType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehículo</label>
                  <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 outline-none">
                    <option value="">Seleccionar vehículo...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Conductor</label>
                  <select 
                    required 
                    disabled={!!currentUser}
                    value={formData.workerId} 
                    onChange={e => setFormData({...formData, workerId: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 outline-none disabled:opacity-50"
                  >
                    <option value="">Seleccionar conductor...</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">KM Inicio</label>
                    <input type="number" required value={formData.startKm} onChange={e => setFormData({...formData, startKm: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-2xl font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">KM Fin</label>
                    <input type="number" required value={formData.endKm} onChange={e => setFormData({...formData, endKm: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-2xl font-bold outline-none" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <p className="text-xs text-slate-400">Distancia: <span className="text-blue-400 font-bold">{formData.distance} km</span></p>
                  <p className="text-xs text-slate-400">Consumo: <span className="text-green-400 font-bold">{formData.fuelConsumed} L</span></p>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 py-4 rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-2xl font-bold">Guardar Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
