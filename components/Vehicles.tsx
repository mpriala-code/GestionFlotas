
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Info, Euro, Calendar, Gauge, FileText, Shield, 
  Wrench, ChevronDown, ChevronUp, FileDown, FileUp, CreditCard, CheckCircle2,
  AlertTriangle, XCircle, RefreshCw
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
  
  // New installment form state
  const [newInsDate, setNewInsDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInsAmount, setNewInsAmount] = useState(0);

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
      plate: '', model: '', type: 'Furgoneta', vin: '',
      year: new Date().getFullYear(), purchaseDate: '', kilometers: 0,
      baseConsumption: 0, wearFactor: 0, taxDate: '', taxAmount: 0,
      nextGeneralPayment: '', insuranceCost: 0, insuranceExpiry: '',
      itvDate: '', lastMaintenance: '', nextMaintenance: '',
      maintStatus: MaintenanceStatus.UP_TO_DATE, maintNotes: '',
      loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0, installments: [] }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este vehículo de la flota?')) {
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

  const clearInstallments = (vehicleId: string) => {
    if (confirm('¿Deseas borrar todo el historial de cuotas de este vehículo?')) {
      setVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, loan: { ...v.loan, installments: [], remainingAmount: v.loan.totalAmount } } : v
      ));
    }
  };

  const handleExport = () => {
    const exportData = vehicles.map(v => ({
      'Matrícula': v.plate,
      'Modelo': v.model,
      'KM Totales': v.kilometers,
      'Consumo Base': v.baseConsumption,
      'Prestamo Activo': v.loan.active ? 'SÍ' : 'NO',
      'Pendiente (€)': v.loan.remainingAmount
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vehiculos");
    XLSX.writeFile(wb, `Inventario_Flota_${new Date().toISOString().split('T')[0]}.xlsx`);
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
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          
          <button onClick={handleExport} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all border border-slate-700 text-xs">
            <FileDown className="w-4 h-4 text-blue-400" /> Exportar Planilla
          </button>

          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20 text-sm">
              <Plus className="w-5 h-5" /> Nuevo Vehículo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl">
            <div className="p-7">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{v.plate}</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{v.model} • {v.type}</p>
                </div>
                <div className="flex gap-1.5">
                  {isAdmin && (
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(v)} className="p-2.5 bg-slate-800 hover:bg-blue-600/20 rounded-xl text-blue-400 transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-2.5 bg-slate-800 hover:bg-red-600/20 rounded-xl text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                  <button onClick={() => toggleExpand(v.id)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                    {expandedId === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Odómetro</p>
                  <p className="font-bold flex items-center gap-2"><Gauge className="w-4 h-4 text-blue-400" /> {v.kilometers.toLocaleString()} <span className="text-[10px] text-slate-500">KM</span></p>
                </div>
                <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Consumo</p>
                  <p className="font-bold text-slate-200"> {v.baseConsumption} <span className="text-[10px] text-slate-500 font-bold">L/100</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-800/20 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <CreditCard className="w-4 h-4 text-yellow-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Préstamo / Financiación</span>
                  </div>
                  <button 
                    onClick={() => setShowLoanModal(v.id)}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                  >
                    Cotas
                  </button>
                </div>
              </div>

              {v.loan.active && (
                <div className="mt-6 pt-4 border-t border-slate-800/50">
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-wider">
                    <span className="text-slate-500">Pendiente de Pago</span>
                    <span className="text-yellow-500">{v.loan.remainingAmount.toLocaleString()} €</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-yellow-500 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                      style={{ width: `${Math.min(100, (1 - v.loan.remainingAmount / (v.loan.totalAmount || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Loan Installments Modal */}
      {showLoanModal && activeVehicleForLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-[2.5rem]">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Cotas de Préstamo</h2>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">{activeVehicleForLoan.plate}</p>
              </div>
              <button onClick={() => setShowLoanModal(null)} className="text-slate-500 hover:text-white text-4xl font-light">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-4 flex-1">
              {isAdmin && (
                <div className="mb-6 p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Acciones del Plan</h4>
                    </div>
                    {activeVehicleForLoan.loan.installments?.length ? (
                      <button 
                        onClick={() => clearInstallments(showLoanModal)}
                        className="text-[9px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 uppercase"
                      >
                        <Trash2 className="w-3 h-3" /> Borrar Plan
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Fecha Cuota</label>
                      <input type="date" value={newInsDate} onChange={e => setNewInsDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Importe (€)</label>
                      <input type="number" placeholder="Ej: 450" value={newInsAmount} onChange={e => setNewInsAmount(parseFloat(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button onClick={() => addManualInstallment(showLoanModal)} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95">Añadir Mensualidad Manual</button>
                </div>
              )}

              {activeVehicleForLoan.loan.installments?.length ? (
                <div className="space-y-3">
                  {activeVehicleForLoan.loan.installments.map(ins => (
                    <div key={ins.id} className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${ins.paid ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-slate-800/50 border-slate-700'}`}>
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl ${ins.paid ? 'bg-green-500/10' : 'bg-slate-700'}`}>
                          <Calendar className={`w-5 h-5 ${ins.paid ? 'text-green-500' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className={`font-black text-lg ${ins.paid ? 'text-green-500/50 line-through' : 'text-slate-200'}`}>{ins.date}</p>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{ins.amount.toLocaleString()} €</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => toggleInstallment(showLoanModal, ins.id)}
                          className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${ins.paid ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                        >
                          {ins.paid ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-slate-600" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 space-y-6 bg-slate-800/20 rounded-[2.5rem] border border-dashed border-slate-800">
                  <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                    <AlertTriangle className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="space-y-2 px-8">
                    <p className="text-slate-400 font-bold">Sin plan de pagos activo</p>
                    <p className="text-xs text-slate-500 max-w-[250px] mx-auto italic">Todavía no se han generado las cotas para este préstamo.</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => generateInstallments(showLoanModal)}
                      className="bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" /> Generar Plan Automático
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-8 border-t border-slate-800 bg-slate-900/80 rounded-b-[2.5rem]">
               <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Pendiente</span>
                    <span className="text-2xl text-yellow-500 font-black">{activeVehicleForLoan.loan.remainingAmount.toLocaleString()} €</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Pagado</span>
                    <span className="text-lg text-green-500 font-bold">
                      {(activeVehicleForLoan.loan.totalAmount - activeVehicleForLoan.loan.remainingAmount).toLocaleString()} €
                    </span>
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
