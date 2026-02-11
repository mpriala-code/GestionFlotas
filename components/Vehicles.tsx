
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Info, Euro, Calendar, Gauge, FileText, Shield, 
  Wrench, ChevronDown, ChevronUp, FileDown, FileUp, CreditCard, CheckCircle2 
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
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLoanModal, setShowLoanModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate: '',
    model: '',
    type: 'Furgoneta',
    vin: '',
    year: new Date().getFullYear(),
    purchaseDate: '',
    kilometers: 0,
    baseConsumption: 0,
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
      plate: '',
      model: '',
      type: 'Furgoneta',
      vin: '',
      year: new Date().getFullYear(),
      purchaseDate: '',
      kilometers: 0,
      baseConsumption: 0,
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
      loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0, installments: [] }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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

  const generateInstallments = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId && v.loan.active) {
        const count = Math.ceil(v.loan.totalAmount / v.loan.monthlyFee);
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
        return { ...v, loan: { ...v.loan, installments: newInstallments } };
      }
      return v;
    }));
  };

  // EXCEL EXPORT
  const handleExport = () => {
    const exportData = vehicles.map(v => ({
      'Matrícula': v.plate,
      'Modelo': v.model,
      'Tipo': v.type,
      'Kilómetros': v.kilometers,
      'Consumo Base': v.baseConsumption,
      'Pendiente Préstamo': v.loan.remainingAmount
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehículos");
    XLSX.writeFile(wb, `Flota_Vehiculos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-bold">Gestión de Flota</h2>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          
          <button onClick={handleExport} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold transition-all border border-slate-700 text-sm">
            <FileDown className="w-4 h-4 text-blue-400" /> Exportar
          </button>

          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20">
              <Plus className="w-5 h-5" /> Añadir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-600 transition-all shadow-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{v.plate}</h3>
                  <p className="text-slate-400 text-sm">{v.model} • {v.type}</p>
                </div>
                <div className="flex gap-1">
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(v)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 bg-slate-800 hover:bg-red-900/40 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                  <button onClick={() => toggleExpand(v.id)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                    {expandedId === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Kilómetros</p>
                  <p className="font-bold flex items-center gap-1.5"><Gauge className="w-3 h-3 text-blue-400" /> {v.kilometers.toLocaleString()} km</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Consumo</p>
                  <p className="font-bold text-slate-200"> {v.baseConsumption} L/100</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-2 font-medium"><CreditCard className="w-4 h-4 text-yellow-500" /> Préstamo</span>
                  <button 
                    onClick={() => setShowLoanModal(v.id)}
                    className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded text-[10px] font-bold hover:bg-yellow-500/20"
                  >
                    GESTIONAR COTAS
                  </button>
                </div>
              </div>

              {expandedId === v.id && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-y-3 text-xs">
                    <div>
                      <p className="text-slate-500 uppercase font-bold mb-0.5">Bastidor (VIN)</p>
                      <p className="text-slate-300 font-mono">{v.vin || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase font-bold mb-0.5">Año Fab.</p>
                      <p className="text-slate-300">{v.year}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase font-bold mb-0.5">ITV</p>
                      <p className="text-slate-300">{v.itvDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase font-bold mb-0.5">Seguro</p>
                      <p className="text-slate-300">{v.insuranceExpiry}</p>
                    </div>
                  </div>
                </div>
              )}

              {v.loan.active && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Restante Préstamo</span>
                    <span className="font-bold text-yellow-500">{v.loan.remainingAmount.toLocaleString()}€</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (1 - v.loan.remainingAmount / v.loan.totalAmount) * 100)}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loan Installments Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Cotas de Préstamo</h2>
                <p className="text-xs text-slate-400">{vehicles.find(v => v.id === showLoanModal)?.plate}</p>
              </div>
              <button onClick={() => setShowLoanModal(null)} className="text-slate-500 hover:text-white text-3xl font-light">&times;</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {vehicles.find(v => v.id === showLoanModal)?.loan.installments?.length ? (
                vehicles.find(v => v.id === showLoanModal)?.loan.installments?.map(ins => (
                  <div key={ins.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${ins.paid ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${ins.paid ? 'bg-green-500/20' : 'bg-slate-700'}`}>
                        <Calendar className={`w-4 h-4 ${ins.paid ? 'text-green-500' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className={`font-bold ${ins.paid ? 'text-green-400 line-through' : 'text-slate-200'}`}>{ins.date}</p>
                        <p className="text-xs text-slate-500 font-medium">{ins.amount.toLocaleString()}€</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => toggleInstallment(showLoanModal, ins.id)}
                        className={`p-2 rounded-xl transition-all ${ins.paid ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-slate-500 italic">No hay cotas generadas para este vehículo.</p>
                  {isAdmin && (
                    <button 
                      onClick={() => generateInstallments(showLoanModal)}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 mx-auto"
                    >
                      Generar Plan de Pagos
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl z-10">
              <h2 className="text-xl font-bold">{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1">
              {/* Form implementation remains similar to original but with enhanced styling and layout */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400 mb-4 font-bold uppercase text-xs">
                  <FileText className="w-4 h-4" /> Información Básica
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Matrícula" />
                  <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500" placeholder="Modelo" />
                  <input type="number" value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: parseInt(e.target.value)})} className="bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="KM actuales" />
                </div>
              </section>

              <section className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-yellow-400 font-bold text-xs uppercase tracking-widest">Financiación / Cotas</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Préstamo Activo</span>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                      checked={formData.loan?.active} 
                      onChange={e => setFormData({...formData, loan: {...formData.loan!, active: e.target.checked}})} 
                    />
                  </div>
                </div>
                {formData.loan?.active && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Total Préstamo (€)</label>
                      <input type="number" value={formData.loan?.totalAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, totalAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Cota Mensual (€)</label>
                      <input type="number" value={formData.loan?.monthlyFee} onChange={e => setFormData({...formData, loan: {...formData.loan!, monthlyFee: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Fecha Inicio</label>
                      <input type="date" value={formData.loan?.startDate} onChange={e => setFormData({...formData, loan: {...formData.loan!, startDate: e.target.value}})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" />
                    </div>
                  </div>
                )}
              </section>
              
              <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
                <button type="button" onClick={closeModal} className="bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-xl font-medium">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
