
import React, { useState } from 'react';
import { 
  Calendar, Wrench, AlertTriangle, CheckCircle2, Clock, Shield, Euro, 
  FileText, ChevronDown, ChevronUp, History, Plus, Trash2, Save
} from 'lucide-react';
import { Vehicle, MaintenanceStatus, MaintenanceRecord } from '../types';
import { Alert } from '../App';

interface MaintenanceProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  isAdmin: boolean;
  alerts: Alert[];
}

const Maintenance: React.FC<MaintenanceProps> = ({ vehicles, setVehicles, isAdmin, alerts }) => {
  const [expandedVehicles, setExpandedVehicles] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Preventivo',
    notes: '',
    statusAtTime: MaintenanceStatus.UP_TO_DATE
  });

  const toggleExpand = (id: string) => {
    setExpandedVehicles(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const updateStatus = (id: string, status: MaintenanceStatus) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, maintStatus: status } : v));
  };

  const handleAddRecord = (vehicleId: string) => {
    if (!newRecord.date || !newRecord.notes) {
      alert("Por favor completa la fecha y las notas.");
      return;
    }

    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: newRecord.date as string,
      type: newRecord.type as any,
      notes: newRecord.notes as string,
      statusAtTime: newRecord.statusAtTime as MaintenanceStatus
    };

    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          lastMaintenance: record.date,
          maintStatus: record.statusAtTime,
          maintNotes: record.notes,
          maintenanceHistory: [record, ...(v.maintenanceHistory || [])]
        };
      }
      return v;
    }));

    setShowAddForm(null);
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      type: 'Preventivo',
      notes: '',
      statusAtTime: MaintenanceStatus.UP_TO_DATE
    });
  };

  const dangerAlerts = alerts.filter(a => a.type === 'danger');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Estado de Mantenimiento y Trámites</h2>
          <p className="text-slate-400 text-sm">Historial técnico y control legal de la flota</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span> Al día
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span> Pendiente
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
            <span className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></span> Atrasado
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {vehicles.map(v => {
          const isExpanded = expandedVehicles.includes(v.id);
          const vehicleAlerts = alerts.filter(a => a.plate === v.plate);

          return (
            <div key={v.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-slate-700">
              {/* Header Row */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none group"
                onClick={() => toggleExpand(v.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    v.maintStatus === MaintenanceStatus.UP_TO_DATE ? 'bg-green-500/10' :
                    v.maintStatus === MaintenanceStatus.PENDING ? 'bg-yellow-500/10' : 'bg-red-500/10'
                  }`}>
                    <Wrench className={`w-6 h-6 ${
                      v.maintStatus === MaintenanceStatus.UP_TO_DATE ? 'text-green-500' :
                      v.maintStatus === MaintenanceStatus.PENDING ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{v.plate}</h3>
                      {vehicleAlerts.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-[9px] font-bold rounded uppercase animate-pulse">
                          {vehicleAlerts.length} Alerta{vehicleAlerts.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{v.model}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 max-w-2xl px-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Próxima Revisión</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {v.nextMaintenance}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Estado Actual</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        v.maintStatus === MaintenanceStatus.UP_TO_DATE ? 'bg-green-500' :
                        v.maintStatus === MaintenanceStatus.PENDING ? 'bg-yellow-500' : 'bg-red-500 shadow-[0_0_8px_red]'
                      }`} />
                      <span className="text-sm font-bold uppercase tracking-tight">{v.maintStatus}</span>
                    </div>
                  </div>
                  <div className="hidden md:block space-y-0.5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Km Actuales</p>
                    <p className="text-sm font-medium text-slate-300">{v.kilometers.toLocaleString()} km</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end mr-4">
                     <p className="text-[10px] text-slate-500 uppercase font-bold">Registros</p>
                     <p className="text-xs font-bold text-slate-400">{(v.maintenanceHistory || []).length}</p>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-900/30 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Alerts Summary */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Trámites y Alertas
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Vencimiento ITV', date: v.itvDate, icon: FileText, color: 'blue' },
                          { label: 'Vencimiento Seguro', date: v.insuranceExpiry, icon: Shield, color: 'purple' },
                          { label: 'Impuesto Circulación', date: v.taxDate, icon: Euro, color: 'green' },
                          { label: 'Próximo Pago', date: v.nextGeneralPayment, icon: Euro, color: 'orange' }
                        ].map((item, idx) => {
                          const isPast = new Date(item.date) < new Date();
                          return (
                            <div key={idx} className="bg-slate-800/40 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-${item.color}-500/10`}>
                                <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-500 uppercase font-bold">{item.label}</p>
                                <p className={`text-xs font-bold ${isPast ? 'text-red-400' : 'text-slate-200'}`}>{item.date}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: History Timeline */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                          <History className="w-4 h-4 text-blue-500" />
                          Historial de Intervenciones
                        </h4>
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowAddForm(showAddForm === v.id ? null : v.id); }}
                            className="text-[10px] font-bold uppercase text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Añadir Registro
                          </button>
                        )}
                      </div>

                      {/* Add Form (Admin Only) */}
                      {isAdmin && showAddForm === v.id && (
                        <div className="bg-slate-800/50 border border-blue-500/30 p-4 rounded-xl space-y-4 animate-in zoom-in-95">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase font-bold">Fecha</label>
                              <input 
                                type="date" 
                                value={newRecord.date} 
                                onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 uppercase font-bold">Tipo</label>
                              <select 
                                value={newRecord.type} 
                                onChange={e => setNewRecord({...newRecord, type: e.target.value as any})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                              >
                                <option>Preventivo</option>
                                <option>Correctivo</option>
                                <option>Revisión ITV</option>
                                <option>Otro</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase font-bold">Notas de la intervención</label>
                            <textarea 
                              value={newRecord.notes}
                              onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                              placeholder="Describe los trabajos realizados..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddForm(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200">Cancelar</button>
                            <button 
                              onClick={() => handleAddRecord(v.id)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Guardar Registro
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Timeline List */}
                      <div className="space-y-4 pl-2 border-l-2 border-slate-800">
                        {v.maintenanceHistory && v.maintenanceHistory.length > 0 ? v.maintenanceHistory.map((entry, idx) => (
                          <div key={entry.id} className="relative pl-6 group">
                            <div className="absolute -left-[11px] top-1.5 w-5 h-5 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center group-hover:border-blue-500 transition-colors">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            </div>
                            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-200">{entry.date}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  entry.type === 'Preventivo' ? 'bg-green-500/10 text-green-400' :
                                  entry.type === 'Correctivo' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {entry.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 italic leading-relaxed">{entry.notes}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 text-center text-slate-500 text-xs italic">
                            No hay historial registrado para este vehículo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {/* Active Notifications Panel (Summary of all vehicles) */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl h-fit">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              Notificaciones Globales
            </h4>
            <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded text-slate-400">Próximos 30 días</span>
          </div>
          
          <div className="space-y-3">
            {warningAlerts.length > 0 ? warningAlerts.map(a => (
              <div key={a.id} className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-200">{a.plate}</p>
                  <p className="text-xs text-yellow-500 font-medium">{a.reason}</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                <CheckCircle2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No hay avisos preventivos activos.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Critical Alerts Panel */}
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl h-fit">
          <h4 className="font-bold flex items-center gap-2 text-red-400 uppercase tracking-widest text-sm">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            Caducados / Críticos
          </h4>
          
          <div className="space-y-3">
            {dangerAlerts.length > 0 ? dangerAlerts.map(a => (
              <div key={a.id} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 shadow-lg shadow-red-500/5">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-200">{a.plate}</p>
                  <p className="text-xs text-red-400 font-bold uppercase">{a.reason}</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center bg-green-500/5 rounded-2xl border border-dashed border-green-500/20">
                <Shield className="w-8 h-8 text-green-900 mx-auto mb-2" />
                <p className="text-green-700 text-sm font-medium">No se detectan trámites atrasados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
