
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
    
    const paidAmount = v.loan.totalAmount - v.loan.remainingAmount;
    const progressPercent = Math.min(100, Math.max(0, (paidAmount / v.loan.totalAmount) * 100));
    
    // Cálculo de cuotas (Cotas)
    const quotasTotal = v.loan.monthlyFee > 0 ? Math.ceil(v.loan.totalAmount / v.loan.monthlyFee) : 0;
    const quotasPaid = v.loan.monthlyFee > 0 ? Math.floor(paidAmount / v.loan.monthlyFee) : 0;
    const quotasRemaining = Math.max(0, quotasTotal - quotasPaid);

    return { paidAmount, progressPercent, quotasPaid, quotasTotal, quotasRemaining };
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
          <h2 className="text-2xl font-bold tracking-tight text-white">Gestión de Flota</h2>
          <p className="text-slate-400 text-sm">Estado técnico, legal y financiero de los activos</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Matrícula o modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
          </div>
          {isAdmin && (
            <button onClick={() => { setFormData({
              plate: '', model: '', type: 'Furgoneta', vin: '', year: 2024,
              purchaseDate: '', kilometers: 0, baseConsumption: 0, wearFactor: 0,
              taxDate: '', taxAmount: 0, nextGeneralPayment: '', insuranceCost: 0,
              insuranceExpiry: '', itvDate: '', lastMaintenance: '', nextMaintenance: '',
              maintStatus: MaintenanceStatus.UP_TO_DATE, maintNotes: '',
              loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0 }
            }); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => {
          const loan = calculateLoanStats(v);
          return (
            <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-xl font-black tracking-tight text-white uppercase">{v.plate}</h3>
                       <div className={`w-2 h-2 rounded-full ${
                         v.maintStatus === MaintenanceStatus.UP_TO_DATE ? 'bg-green-500' : 
                         v.maintStatus === MaintenanceStatus.PENDING ? 'bg-yellow-500' : 'bg-red-500'
                       }`} />
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{v.model}</p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button onClick={() => { setEditingVehicle(v); setFormData(v); setShowModal(true); }} className="p-2.5 bg-slate-800/50 hover:bg-blue-900/30 text-slate-500 hover:text-blue-400 rounded-xl transition-all border border-slate-800"><Edit2 className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} className="p-2.5 bg-slate-800/50 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-800 transition-all"><ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedId === v.id ? 'rotate-180' : ''}`} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Kilometraje</p>
                    <p className="text-sm font-black text-slate-200 flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-blue-500" /> 
                      {v.kilometers.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">km</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">Cotas Pagadas</p>
                    <p className="text-sm font-black text-yellow-500 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> 
                      {loan ? `${loan.quotasPaid} de ${loan.quotasTotal}` : 'N/A'}
                    </p>
                  </div>
                </div>

                {v.loan?.active && loan && (
                  <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 group-hover:border-yellow-500/20 transition-all">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pendiente Préstamo</p>
                        <p className="text-xl font-black text-slate-100">{v.loan.remainingAmount.toLocaleString()}€</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Progreso</p>
                        <span className="text-xs font-black text-yellow-500">{loan.progressPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)] transition-all duration-1000 ease-out" style={{ width: `${loan.progressPercent}%` }} />
                    </div>
                    
                    <div className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Importe Cota</span>
                        <span className="text-[11px] font-black text-slate-200">{v.loan.monthlyFee}€ / mes</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Cotas Restantes</span>
                        <span className="text-[11px] font-black text-yellow-500">{loan.quotasRemaining} cuotas</span>
                      </div>
                    </div>
                  </div>
                )}

                {expandedId === v.id && (
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      <div className="bg-slate-800/20 p-2 rounded-lg"><p className="text-slate-500 font-bold uppercase tracking-tighter mb-0.5">Vencimiento ITV</p><p className="font-bold text-slate-200">{v.itvDate || '---'}</p></div>
                      <div className="bg-slate-800/20 p-2 rounded-lg"><p className="text-slate-500 font-bold uppercase tracking-tighter mb-0.5">Vencimiento Seguro</p><p className="font-bold text-slate-200">{v.insuranceExpiry || '---'}</p></div>
                      <div className="bg-slate-800/20 p-2 rounded-lg"><p className="text-slate-500 font-bold uppercase tracking-tighter mb-0.5">Impuesto Circ.</p><p className="font-bold text-slate-200">{v.taxDate} ({v.taxAmount}€)</p></div>
                      <div className="bg-slate-800/20 p-2 rounded-lg"><p className="text-slate-500 font-bold uppercase tracking-tighter mb-0.5">Consumo L/100</p><p className="font-bold text-slate-200">{v.baseConsumption} L</p></div>
                    </div>
                    {isAdmin && (
                      <div className="pt-4 flex justify-end">
                        <button onClick={() => deleteVehicle(v.id)} className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-bold uppercase transition-colors px-3 py-1.5 hover:bg-red-500/5 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar de la Flota
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
                <h2 className="text-2xl font-black text-white">{editingVehicle ? 'Editar Ficha Vehículo' : 'Nueva Alta en Flota'}</h2>
                <p className="text-slate-500 text-xs">Información técnica, operativa y de financiación</p>
              </div>
              <button onClick={closeModal} className="text-3xl text-slate-500 hover:text-white transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Matrícula</label><input required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="1234ABC" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Modelo / Descripción</label><input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Renault Master L3H2" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Km Actuales (Odómetro)</label><input type="number" required value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" /></div>
              </div>
              
              <div className="bg-slate-800/30 p-8 rounded-3xl border border-slate-700 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                   <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-4 h-4" /> Gestión de Préstamo / Financiación</h3>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Activar Financiación</span>
                     <div className="relative inline-flex items-center">
                        <input type="checkbox" className="sr-only peer" checked={formData.loan?.active} onChange={e => setFormData({...formData, loan: {...formData.loan!, active: e.target.checked}})} />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                     </div>
                   </label>
                </div>
                {formData.loan?.active && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Monto Total Financiado</label><input type="number" value={formData.loan?.totalAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, totalAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Importe de la Cota Mensual</label><input type="number" value={formData.loan?.monthlyFee} onChange={e => setFormData({...formData, loan: {...formData.loan!, monthlyFee: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Importe Pendiente de Pago</label><input type="number" value={formData.loan?.remainingAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, remainingAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Fecha Final de Pago</label><input type="date" value={formData.loan?.endDate} onChange={e => setFormData({...formData, loan: {...formData.loan!, endDate: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none" /></div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">ITV (Próxima)</label><input type="date" value={formData.itvDate} onChange={e => setFormData({...formData, itvDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Seguro (Vencimiento)</label><input type="date" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase">Consumo Estimado (L/100km)</label><input type="number" step="0.1" value={formData.baseConsumption} onChange={e => setFormData({...formData, baseConsumption: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" /></div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-8 py-3 rounded-xl bg-slate-800 font-black text-[10px] uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="px-10 py-3 rounded-xl bg-blue-600 font-black text-[10px] uppercase tracking-widest text-white transition-all hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-95">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
