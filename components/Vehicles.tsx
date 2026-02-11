
import React, { useState, useRef, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Info, Euro, Calendar, Gauge, FileText, Shield, Wrench, ChevronDown, ChevronUp, FileDown, FileUp, CreditCard } from 'lucide-react';
import { Vehicle, MaintenanceStatus } from '../types';

declare const XLSX: any;

interface VehiclesProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  isAdmin: boolean;
}

const Vehicles: React.FC<VehiclesProps> = ({ vehicles, setVehicles, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '', model: '', type: 'Furgoneta', vin: '', year: 2024,
    purchaseDate: '', kilometers: 0, baseConsumption: 0, wearFactor: 0,
    taxDate: '', taxAmount: 0, nextGeneralPayment: '', insuranceCost: 0,
    insuranceExpiry: '', itvDate: '', lastMaintenance: '', nextMaintenance: '',
    maintStatus: MaintenanceStatus.UP_TO_DATE, maintNotes: '',
    loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0 }
  });

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...formData as Vehicle } : v));
    } else {
      setVehicles(prev => [...prev, { ...formData as Vehicle, id: Math.random().toString(36).substr(2, 9), maintenanceHistory: [] }]);
    }
    closeModal();
  };

  const closeModal = () => { setShowModal(false); setEditingVehicle(null); };

  const calculateLoanStats = (v: Vehicle) => {
    if (!v.loan || !v.loan.active || v.loan.totalAmount <= 0) return null;
    const paid = v.loan.totalAmount - v.loan.remainingAmount;
    const progress = Math.min(100, Math.max(0, (paid / v.loan.totalAmount) * 100));
    
    // Estimación de cuotas (cotas)
    const quotasTotal = v.loan.monthlyFee > 0 ? Math.ceil(v.loan.totalAmount / v.loan.monthlyFee) : 0;
    const quotasPaid = v.loan.monthlyFee > 0 ? Math.floor(paid / v.loan.monthlyFee) : 0;
    const quotasRemaining = Math.max(0, quotasTotal - quotasPaid);

    return { paid, progress, quotasPaid, quotasTotal, quotasRemaining };
  };

  const deleteVehicle = (id: string) => {
    if (confirm('¿Eliminar este vehículo de la flota permanentemente?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Flota</h2>
          <p className="text-slate-400 text-sm">Control técnico y financiero de los vehículos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Buscar por matrícula o modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
          </div>
          {isAdmin && (
            <button onClick={() => { setFormData({
              plate: '', model: '', type: 'Furgoneta', vin: '', year: 2024,
              purchaseDate: '', kilometers: 0, baseConsumption: 0, wearFactor: 0,
              taxDate: '', taxAmount: 0, nextGeneralPayment: '', insuranceCost: 0,
              insuranceExpiry: '', itvDate: '', lastMaintenance: '', nextMaintenance: '',
              maintStatus: MaintenanceStatus.UP_TO_DATE, maintNotes: '',
              loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0 }
            }); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Nuevo Vehículo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => {
          const loanStats = calculateLoanStats(v);
          return (
            <div key={v.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden group hover:border-slate-700 transition-all shadow-md">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-xl font-black tracking-tight text-white">{v.plate}</h3>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                         v.maintStatus === MaintenanceStatus.UP_TO_DATE ? 'bg-green-500/10 text-green-400' : 
                         v.maintStatus === MaintenanceStatus.PENDING ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                       }`}>
                         {v.maintStatus}
                       </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{v.model} • {v.type}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {isAdmin && (
                      <button onClick={() => { setEditingVehicle(v); setFormData(v); setShowModal(true); }} className="p-2 bg-slate-800/50 hover:bg-blue-900/30 text-slate-500 hover:text-blue-400 rounded-xl transition-all border border-slate-800"><Edit2 className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-800 transition-all"><ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedId === v.id ? 'rotate-180' : ''}`} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Kilometraje</p>
                    <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-blue-500" /> 
                      {v.kilometers.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">km</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Cotas Pagadas</p>
                    <p className="text-sm font-bold text-yellow-500 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> 
                      {loanStats ? `${loanStats.quotasPaid} / ${loanStats.quotasTotal}` : 'N/A'}
                    </p>
                  </div>
                </div>

                {v.loan?.active && loanStats && (
                  <div className="space-y-3 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 group-hover:border-yellow-500/20 transition-all">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pendiente Préstamo</p>
                        <p className="text-lg font-black text-slate-100">{v.loan.remainingAmount.toLocaleString()}€</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">{loanStats.progress.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-1000 ease-out" style={{ width: `${loanStats.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1"><Euro className="w-2.5 h-2.5" /> {v.loan.monthlyFee}€ / mes</span>
                      <span className="text-slate-400">Restan {loanStats.quotasRemaining} cotas</span>
                    </div>
                  </div>
                )}

                {expandedId === v.id && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      <div className="space-y-0.5"><p className="text-slate-500 font-bold uppercase tracking-tighter">Vencimiento ITV</p><p className="font-bold text-slate-200">{v.itvDate || 'No asignada'}</p></div>
                      <div className="space-y-0.5"><p className="text-slate-500 font-bold uppercase tracking-tighter">Vencimiento Seguro</p><p className="font-bold text-slate-200">{v.insuranceExpiry || 'No asignada'}</p></div>
                      <div className="space-y-0.5"><p className="text-slate-500 font-bold uppercase tracking-tighter">Impuesto Circulación</p><p className="font-bold text-slate-200">{v.taxDate} ({v.taxAmount}€)</p></div>
                      <div className="space-y-0.5"><p className="text-slate-500 font-bold uppercase tracking-tighter">Consumo Base</p><p className="font-bold text-slate-200">{v.baseConsumption} L / 100km</p></div>
                    </div>
                    {isAdmin && (
                      <div className="pt-4 flex justify-end border-t border-slate-800">
                        <button onClick={() => deleteVehicle(v.id)} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-bold uppercase transition-colors">
                          <Trash2 className="w-3 h-3" /> Eliminar Vehículo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl p-8 my-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-2xl font-black text-white">{editingVehicle ? 'Editar Vehículo' : 'Nueva Alta de Vehículo'}</h2>
                <p className="text-slate-500 text-xs">Completa la ficha técnica y financiera</p>
              </div>
              <button onClick={closeModal} className="text-3xl text-slate-500 hover:text-white transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Matrícula</label><input required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="1234ABC" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Modelo</label><input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Renault Master" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Kilómetros Iniciales</label><input type="number" required value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none" /></div>
              </div>
              
              <div className="bg-slate-800/30 p-7 rounded-3xl border border-slate-700 space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-4 h-4" /> Financiación y Cotas</h3>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Activar Préstamo</span>
                     <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded-md" checked={formData.loan?.active} onChange={e => setFormData({...formData, loan: {...formData.loan!, active: e.target.checked}})} />
                   </label>
                </div>
                {formData.loan?.active && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Importe Total Financiado</label><input type="number" value={formData.loan?.totalAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, totalAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-yellow-500/50 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Cota Mensual (€)</label><input type="number" value={formData.loan?.monthlyFee} onChange={e => setFormData({...formData, loan: {...formData.loan!, monthlyFee: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-yellow-500/50 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Importe Pendiente Hoy</label><input type="number" value={formData.loan?.remainingAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, remainingAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-yellow-500/50 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Fecha Finalización</label><input type="date" value={formData.loan?.endDate} onChange={e => setFormData({...formData, loan: {...formData.loan!, endDate: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none" /></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">ITV (Próxima)</label><input type="date" value={formData.itvDate} onChange={e => setFormData({...formData, itvDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Seguro (Vencimiento)</label><input type="date" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Impuesto (Monto €)</label><input type="number" value={formData.taxAmount} onChange={e => setFormData({...formData, taxAmount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm" /></div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-7 py-3 rounded-xl bg-slate-800 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="px-10 py-3 rounded-xl bg-blue-600 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-95">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
