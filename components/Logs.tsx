
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  HardHat,
  FileDown,
  FileUp,
  ArrowRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { LogEntry, Vehicle, Worker, Work, TripType, WorkStatus } from '../types';

declare const XLSX: any;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Quick log state
  const [quickVehicleId, setQuickVehicleId] = useState('');
  const [quickWorkId, setQuickWorkId] = useState('');
  const [quickEndKm, setQuickEndKm] = useState<number | ''>('');

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

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, workerId: currentUser.id }));
    }
  }, [currentUser]);

  const summary = useMemo(() => {
    return logs.reduce((acc, log) => ({
      totalKm: acc.totalKm + log.distance,
      totalFuel: acc.totalFuel + log.fuelConsumed,
      count: acc.count + 1
    }), { totalKm: 0, totalFuel: 0, count: 0 });
  }, [logs]);

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

  useEffect(() => {
    if (formData.vehicleId && formData.startKm !== undefined && formData.endKm !== undefined) {
      const v = vehicles.find(v => v.id === formData.vehicleId);
      if (v) {
        const distance = (formData.endKm || 0) - (formData.startKm || 0);
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
    processEntry(formData as LogEntry);
    setShowModal(false);
    resetForm();
  };

  const processEntry = (entry: LogEntry) => {
    if (!entry.vehicleId || !entry.workerId) {
      alert("Por favor, selecciona un vehículo y conductor.");
      return;
    }
    const distance = (entry.endKm || 0) - (entry.startKm || 0);
    if (distance < 0) {
      alert("El kilometraje final debe ser mayor al inicial.");
      return;
    }

    setSaveStatus('saving');
    const newLog = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
    };

    setLogs(prev => [...prev, newLog]);
    setVehicles(prev => prev.map(v => 
      v.id === entry.vehicleId ? { ...v, kilometers: entry.endKm || v.kilometers } : v
    ));

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVehicleId || !quickWorkId || quickEndKm === '') return;
    
    const v = vehicles.find(veh => veh.id === quickVehicleId);
    if (!v) return;

    const startKm = v.kilometers;
    const distance = quickEndKm - startKm;
    const adjustedConsumption = v.baseConsumption * (1 + v.wearFactor / 100);
    const fuel = (distance / 100) * adjustedConsumption;

    const quickLog: LogEntry = {
      id: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      vehicleId: quickVehicleId,
      workerId: currentUser?.id || '',
      workId: quickWorkId,
      tripType: TripType.WORKS,
      startKm: startKm,
      endKm: quickEndKm,
      distance: distance,
      fuelConsumed: Number(fuel.toFixed(2)),
      avgConsumption: Number(adjustedConsumption.toFixed(2)),
      notes: 'Registro rápido'
    };

    processEntry(quickLog);
    setQuickEndKm('');
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

  const handleExport = () => {
    const exportData = logs.map(log => ({
      'Fecha': log.date, 'Hora': log.time,
      'Matrícula': vehicles.find(v => v.id === log.vehicleId)?.plate || '',
      'Conductor': workers.find(w => w.id === log.workerId)?.name || '',
      'Obra': works.find(o => o.id === log.workId)?.name || 'N/A',
      'KM Inicio': log.startKm, 'KM Fin': log.endKm, 'Distancia': log.distance, 'Litros': log.fuelConsumed
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros");
    XLSX.writeFile(wb, `Registros_Flota_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const activeWorks = works.filter(w => w.status === WorkStatus.ACTIVE);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-blue-500" />
            Panel de Registros
          </h2>
          <p className="text-slate-400 text-sm">Gestiona tus trayectos y consumos diarios</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {saveStatus === 'saved' && (
             <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 text-xs font-bold animate-in fade-in zoom-in">
               <CheckCircle2 className="w-4 h-4" /> Guardado Correctamente
             </div>
          )}
          <button onClick={handleExport} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-slate-700 text-xs">
            <FileDown className="w-4 h-4 text-blue-400" /> Exportar
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" />
            Añadir Nuevo Registro
          </button>
        </div>
      </div>

      {/* QUICK LOG WIDGET */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Zap className="w-24 h-24 text-blue-500" />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20"><Zap className="w-4 h-4 text-white" /></div>
          <div>
            <h3 className="text-lg font-bold">Registro Rápido</h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Añade un trayecto en segundos</p>
          </div>
        </div>
        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Vehículo Utilizado</label>
            <select 
              value={quickVehicleId} 
              onChange={e => setQuickVehicleId(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="">¿Qué vehículo llevas?</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Obra de Destino</label>
            <select 
              value={quickWorkId} 
              onChange={e => setQuickWorkId(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="">¿A qué obra vas?</option>
              {activeWorks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Kilómetros al Llegar</label>
            <input 
              type="number" 
              placeholder="KM finales..."
              value={quickEndKm} 
              onChange={e => setQuickEndKm(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={!quickVehicleId || !quickWorkId || quickEndKm === ''}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 h-[46px] rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Registrar Trayecto
          </button>
        </form>
      </div>

      {/* Historial Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Historial Reciente</h3>
          <div className="flex gap-4 text-[10px] font-bold text-slate-500">
            <span>{summary.count} VIAJES</span>
            <span className="text-blue-500">{summary.totalKm.toLocaleString()} KM</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-wider">Vehículo</th>
                <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-wider">Detalles</th>
                <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-wider">Kilometraje</th>
                <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-wider text-right">Consumo</th>
                {isAdmin && <th className="px-6 py-5 font-bold uppercase text-[10px] tracking-wider text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.slice().sort((a,b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 15).map(log => {
                const v = vehicles.find(v => v.id === log.vehicleId);
                const w = workers.find(w => w.id === log.workerId);
                const o = works.find(o => o.id === log.workId);
                return (
                  <tr key={log.id} className="hover:bg-blue-600/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{log.date}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {log.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-400">{v?.plate || '---'}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">{log.tripType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-500" /> {w?.name || '---'}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <HardHat className="w-3.5 h-3.5" /> {o?.name || 'Trayecto Libre'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        {log.startKm} <ArrowRight className="w-3 h-3 text-blue-500/50" /> {log.endKm}
                      </div>
                      <div className="font-bold text-slate-200 text-sm">{log.distance} km</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-green-400 text-base">{log.fuelConsumed} L</div>
                      <div className="text-[9px] text-slate-500">({log.avgConsumption} L/100)</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => deleteLog(log.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-500 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic bg-slate-900/20">
                    No se han registrado trayectos todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button (FAB) para acceso directo en móvil */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-50 border-4 border-slate-950 group"
        title="Nuevo Registro"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Detalle de Nuevo Trayecto</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors text-3xl font-light">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fecha del Viaje</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hora de Inicio</label>
                  <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vehículo Utilizado</label>
                <select required value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  <option value="">Seleccionar vehículo...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tipo de Trayecto</label>
                  <select value={formData.tripType} onChange={e => setFormData({...formData, tripType: e.target.value as TripType})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none">
                    {Object.values(TripType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Obra / Destino</label>
                  <select required value={formData.workId} onChange={e => setFormData({...formData, workId: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none">
                    <option value="">¿A qué obra pertenece?</option>
                    {activeWorks.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 flex flex-col items-center gap-6">
                <div className="grid grid-cols-2 gap-8 w-full">
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 tracking-widest">KM AL SALIR</label>
                    <input type="number" required value={formData.startKm} onChange={e => setFormData({...formData, startKm: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-3xl font-black text-center outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 tracking-widest">KM AL LLEGAR</label>
                    <input type="number" required value={formData.endKm} onChange={e => setFormData({...formData, endKm: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-3xl font-black text-center outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-6 text-xs font-bold uppercase text-slate-400">
                  <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
                    <TrendingUp className="w-4 h-4 text-blue-500" /> {formData.distance} km recorridos
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
                    <Fuel className="w-4 h-4 text-green-500" /> {formData.fuelConsumed} L consumidos (Est.)
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 py-4 rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all active:scale-95">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;
