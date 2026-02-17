
import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Gauge, CreditCard, CheckCircle2,
  AlertTriangle, FileDown, Calendar, Eye, Info, Car, Wallet
} from 'lucide-react';
import { Vehicle, MaintenanceStatus, Installment } from '../types';

declare const XLSX: any;

interface VehiclesProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  isAdmin: boolean;
}

const Vehicles: React.FC<VehiclesProps> = ({ vehicles, setVehicles, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showLoanModal, setShowLoanModal] = useState<string | null>(null);
  
  const [newInsDate, setNewInsDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInsAmount, setNewInsAmount] = useState(0);

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    model: '',
    type: 'Furgoneta',
    vin: '',
    year: new Date().getFullYear(),
    purchaseDate: new Date().toISOString().split('T')[0],
    kilometers: 0,
    baseConsumption: 8.0,
    wearFactor: 0,
    taxDate: '',
    taxAmount: 0,
    nextGeneralPayment: '',
    insuranceCost: 0,
    insuranceExpiry: '',
    itvDate: '',
    lastMaintenance: '',
    nextMaintenance: '',
    maintStatus: MaintenanceStatus.UP_TO_DATE,
    maintNotes: '',
    loan: {
      active: false,
      totalAmount: 0,
      monthlyFee: 0,
      startDate: '',
      endDate: '',
      remainingAmount: 0,
      installments: []
    }
  });

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...formData as Vehicle } : v));
    } else {
      const newVehicle = {
        ...formData as Vehicle,
        id: Math.random().toString(36).substr(2, 9),
        maintenanceHistory: []
      };
      setVehicles(prev => [...prev, newVehicle]);
    }
    closeModal();
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData(v);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      plate: '', model: '', type: 'Furgoneta', vin: '',
      year: new Date().getFullYear(), purchaseDate: '', kilometers: 0,
      baseConsumption: 8.0, wearFactor: 0, taxDate: '', taxAmount: 0,
      nextGeneralPayment: '', insuranceCost: 0, insuranceExpiry: '',
      itvDate: '', lastMaintenance: '', nextMaintenance: '',
      maintStatus: MaintenanceStatus.UP_TO_DATE, maintNotes: '',
      loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0, installments: [] }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const toggleInstallment = (vehicleId: string, installmentId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId && v.loan.installments) {
        const updatedInstallments = v.loan.installments.map(ins => 
          ins.id === installmentId ? { ...ins, paid: !ins.paid } : ins
        );
        const paidTotal = updatedInstallments.filter(i => i.paid).reduce((acc, i) => acc + i.amount, 0);
        return {
          ...v,
          loan: {
            ...v.loan,
            installments: updatedInstallments,
            remainingAmount: Math.max(0, v.loan.totalAmount - paidTotal)
          }
        };
      }
      return v;
    }));
  };

  const addManualInstallment = (vehicleId: string) => {
    if (newInsAmount <= 0) return;
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newIns: Installment = {
          id: Math.random().toString(36).substr(2, 9),
          date: newInsDate,
          amount: newInsAmount,
          paid: false
        };
        const currentInstallments = v.loan.installments || [];
        const updatedInstallments = [...currentInstallments, newIns].sort((a, b) => a.date.localeCompare(b.date));
        return {
          ...v,
          loan: { ...v.loan, installments: updatedInstallments }
        };
      }
      return v;
    }));
    setNewInsAmount(0);
  };

  const generateInstallments = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId && v.loan.active) {
        const count = Math.ceil(v.loan.totalAmount / (v.loan.monthlyFee || 1));
        const newInstallments: Installment[] = [];
        const start = v.loan.startDate ? new Date(v.loan.startDate) : new Date();
        
        for (let i = 0; i < count; i++) {
          const d = new Date(start);
          d.setMonth(d.getMonth() + i);
          newInstallments.push({
            id: Math.random().toString(36).substr(2, 9),
            date: d.toISOString().split('T')[0],
            amount: v.loan.monthlyFee,
            paid: false
          });
        }
        return { ...v, loan: { ...v.loan, installments: newInstallments, remainingAmount: v.loan.totalAmount } };
      }
      return v;
    }));
  };

  const handleExport = () => {
    const exportData = vehicles.map(v => ({
      'Matrícula': v.plate,
      'Modelo': v.model,
      'KM Totales': v.kilometers,
      'Préstamo Activo': v.loan.active ? 'SÍ' : 'NO',
      'Pendiente (€)': v.loan.remainingAmount
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehículos");
    XLSX.writeFile(wb, `Flota_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const activeVehicleForLoan = vehicles.find(v => v.id === showLoanModal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventario de Vehículos</h2>
          <p className="text-slate-400 text-sm">Control de fichas técnicas y financiación</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por matrícula o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all">
            <FileDown className="w-4 h-4" /> Exportar
          </button>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 text-sm transition-all active:scale-95">
              <Plus className="w-5 h-5" /> Nuevo Vehículo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-blue-500/40 transition-all duration-300 shadow-xl flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-600/10 p-3 rounded-2xl">
                  <Car className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleDelete(v.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-3xl font-black tracking-tighter text-white mb-1">{v.plate}</h3>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{v.model} • {v.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Kilómetros</p>
                   <p className="font-bold flex items-center gap-2 text-slate-200"><Gauge className="w-4 h-4 text-blue-500" /> {v.kilometers.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Préstamo</p>
                   {v.loan.active ? (
                     <p className="font-bold text-yellow-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Activo</p>
                   ) : (
                     <p className="font-bold text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Pagado</p>
                   )}
                </div>
              </div>

              {v.loan.active && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-500 font-black uppercase">Pendiente de amortizar</span>
                    <span className="text-sm font-black text-yellow-500">{v.loan.remainingAmount.toLocaleString()} €</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                     <div 
                      className="bg-yellow-500 h-full transition-all duration-1000" 
                      style={{ width: `${Math.max(5, Math.min(100, (1 - (v.loan.remainingAmount / (v.loan.totalAmount || 1))) * 100))}%` }} 
                     />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/20 border-t border-slate-800 flex gap-3">
              <button 
                onClick={() => setShowDetailsModal(v)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Eye className="w-4 h-4" /> Ver Detalles
              </button>
              <button 
                onClick={() => openEdit(v)}
                className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-blue-500/20"
              >
                <Edit2 className="w-4 h-4" /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal (View Only) */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 my-8 overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-600/10 to-transparent">
              <div>
                <h2 className="text-3xl font-black tracking-tighter">{showDetailsModal.plate}</h2>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{showDetailsModal.model} • Ficha Técnica</p>
              </div>
              <button onClick={() => setShowDetailsModal(null)} className="text-slate-500 hover:text-white text-4xl font-light">&times;</button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: 'Kilómetros', value: `${showDetailsModal.kilometers.toLocaleString()} km`, icon: Gauge, color: 'text-blue-500' },
                  { label: 'Año', value: showDetailsModal.year, icon: Calendar, color: 'text-slate-400' },
                  { label: 'Consumo', value: `${showDetailsModal.baseConsumption} L/100`, icon: Car, color: 'text-green-500' },
                  { label: 'Fecha ITV', value: showDetailsModal.itvDate || 'Pendiente', icon: Info, color: 'text-orange-500' },
                  { label: 'Seguro', value: `${showDetailsModal.insuranceCost}€`, icon: Wallet, color: 'text-purple-500' },
                  { label: 'Amortizado', value: showDetailsModal.loan.active ? `${(showDetailsModal.loan.totalAmount - showDetailsModal.loan.remainingAmount).toLocaleString()}€` : '100%', icon: CheckCircle2, color: 'text-yellow-500' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                    <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">{item.label}</p>
                    <p className="font-bold text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/20 p-6 rounded-3xl border border-slate-800">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Notas de Mantenimiento</h4>
                <p className="text-sm text-slate-300 italic">"{showDetailsModal.maintNotes || 'No hay notas registradas.'}"</p>
              </div>

              {showDetailsModal.loan.active && (
                <div className="bg-yellow-500/5 p-6 rounded-3xl border border-yellow-500/20 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-yellow-500/10 rounded-2xl"><Wallet className="w-6 h-6 text-yellow-500" /></div>
                     <div>
                       <p className="text-xs font-bold text-yellow-500 uppercase">Estado de la Financiación</p>
                       <p className="text-slate-400 text-xs">Cuota mensual: {showDetailsModal.loan.monthlyFee}€</p>
                     </div>
                   </div>
                   <button 
                    onClick={() => { setShowDetailsModal(null); setShowLoanModal(showDetailsModal.id); }}
                    className="bg-yellow-500 text-slate-950 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-500/20"
                   >
                     Ver Plan de Pagos
                   </button>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-800 flex justify-end bg-slate-900/50">
              <button onClick={() => setShowDetailsModal(null)} className="bg-slate-800 px-8 py-3 rounded-xl font-bold text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Vehicle Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 my-8">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-white text-3xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Datos Generales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Matrícula</label>
                    <input required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Modelo</label>
                    <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Kilómetros Actuales</label>
                    <input type="number" required value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Consumo L/100</label>
                    <input type="number" step="0.1" required value={formData.baseConsumption} onChange={e => setFormData({...formData, baseConsumption: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Fecha ITV</label>
                    <input type="date" value={formData.itvDate} onChange={e => setFormData({...formData, itvDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Expiración Seguro</label>
                    <input type="date" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest border-l-4 border-yellow-500 pl-3">Financiación</h3>
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <input type="checkbox" checked={formData.loan?.active} onChange={e => setFormData({...formData, loan: {...formData.loan!, active: e.target.checked}})} className="w-5 h-5 rounded accent-yellow-500" />
                  <span className="text-sm font-bold text-slate-300">Este vehículo tiene un préstamo activo</span>
                </div>
                {formData.loan?.active && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Importe Total (€)</label>
                        <input type="number" value={formData.loan.totalAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, totalAmount: parseFloat(e.target.value), remainingAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Cuota Mensual (€)</label>
                        <input type="number" value={formData.loan.monthlyFee} onChange={e => setFormData({...formData, loan: {...formData.loan!, monthlyFee: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Fecha Inicio</label>
                        <input type="date" value={formData.loan.startDate} onChange={e => setFormData({...formData, loan: {...formData.loan!, startDate: e.target.value}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 font-bold uppercase mb-1">Fecha Fin</label>
                        <input type="date" value={formData.loan.endDate} onChange={e => setFormData({...formData, loan: {...formData.loan!, endDate: e.target.value}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex gap-4 pt-4 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Installments Modal ("Cotas") */}
      {showLoanModal && activeVehicleForLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Cotas de Préstamo</h2>
                <p className="text-xs text-blue-400 font-bold uppercase">{activeVehicleForLoan.plate}</p>
              </div>
              <button onClick={() => setShowLoanModal(null)} className="text-slate-500 hover:text-white text-4xl font-light">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-4 flex-1">
              {isAdmin && (
                <div className="mb-6 p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-blue-400">Añadir Mensualidad</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={newInsDate} onChange={e => setNewInsDate(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
                    <input type="number" placeholder="Importe €" value={newInsAmount} onChange={e => setNewInsAmount(parseFloat(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm" />
                  </div>
                  <button onClick={() => addManualInstallment(showLoanModal)} className="w-full bg-blue-600 py-3 rounded-xl font-bold text-xs">Añadir Cuota Manual</button>
                </div>
              )}

              {activeVehicleForLoan.loan.installments?.length ? (
                <div className="space-y-3">
                  {activeVehicleForLoan.loan.installments.map(ins => (
                    <div key={ins.id} className={`p-5 rounded-3xl border flex items-center justify-between ${ins.paid ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl ${ins.paid ? 'bg-green-500/10' : 'bg-slate-700'}`}>
                          <Calendar className={`w-5 h-5 ${ins.paid ? 'text-green-500' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className={`font-black text-lg ${ins.paid ? 'text-green-500/50 line-through' : 'text-slate-200'}`}>{ins.date}</p>
                          <p className="text-sm text-slate-500 font-bold">{ins.amount.toLocaleString()} €</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleInstallment(showLoanModal, ins.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${ins.paid ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                      >
                        {ins.paid ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-slate-600" />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-800/20 rounded-[2.5rem] border border-dashed border-slate-800">
                  <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 font-bold">Sin plan de pagos</p>
                  <button 
                    onClick={() => generateInstallments(showLoanModal)}
                    className="mt-4 bg-blue-600 px-6 py-3 rounded-xl font-black text-xs uppercase"
                  >
                    Generar Automáticamente
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-8 border-t border-slate-800 bg-slate-900/80 rounded-b-[2.5rem]">
               <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">Pendiente</span>
                    <span className="text-2xl text-yellow-500 font-black block">{activeVehicleForLoan.loan.remainingAmount.toLocaleString()} €</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Total Crédito</span>
                    <span className="text-lg text-slate-300 font-bold block">{activeVehicleForLoan.loan.totalAmount.toLocaleString()} €</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
