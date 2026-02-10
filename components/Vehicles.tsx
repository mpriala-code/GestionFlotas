
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Info, Euro, Calendar, Gauge, FileText, Shield, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Vehicle, MaintenanceStatus } from '../types';

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
      remainingAmount: 0
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
      loan: { active: false, totalAmount: 0, monthlyFee: 0, startDate: '', endDate: '', remainingAmount: 0 }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Gestión de Flota</h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por matrícula o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-5 h-5" />
              Añadir
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(v)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(v.id)} className="p-2 bg-slate-800 hover:bg-red-900/40 rounded-lg text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Consumo Base</p>
                  <p className="font-bold flex items-center gap-1.5 text-slate-200"> {v.baseConsumption} L/100</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-500" /> ITV</span>
                  <span className={`font-medium ${new Date(v.itvDate) < new Date() ? 'text-red-400' : 'text-slate-200'}`}>{v.itvDate}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-500" /> Seguro</span>
                  <span className={`font-medium ${new Date(v.insuranceExpiry) < new Date() ? 'text-red-400' : 'text-slate-200'}`}>{v.insuranceExpiry}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-500" /> Prox. Mantenimiento</span>
                  <span className="font-medium text-slate-200">{v.nextMaintenance}</span>
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
                      <p className="text-slate-500 uppercase font-bold mb-0.5">Último Manto.</p>
                      <p className="text-slate-300">{v.lastMaintenance || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase font-bold mb-0.5">Impuesto Circ.</p>
                      <p className="text-slate-300">{v.taxAmount}€ ({v.taxDate})</p>
                    </div>
                  </div>
                  {v.maintNotes && (
                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Notas Manto.</p>
                      <p className="text-slate-400 text-xs italic line-clamp-2">{v.maintNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {v.loan.active && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Préstamo Pendiente</span>
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl z-10 shrink-0">
              <h2 className="text-xl font-bold">{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1">
              {/* Basic Info Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-bold uppercase text-sm tracking-wider">Información Básica</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Matrícula</label>
                    <input required value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0000-XXX" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Modelo</label>
                    <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Renault Master..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Tipo</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none">
                      <option>Furgoneta</option>
                      <option>Camión</option>
                      <option>Turismo</option>
                      <option>Motocicleta</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Año Fabricación</label>
                    <input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Fecha Compra</label>
                    <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Kilómetros actuales</label>
                    <input type="number" value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: parseInt(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-slate-400">VIN / Número de Bastidor</label>
                    <input value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" placeholder="VF123..." />
                  </div>
                </div>
              </section>

              {/* Taxes and General Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <Euro className="w-5 h-5" />
                  <h3 className="font-bold uppercase text-sm tracking-wider">Impuestos y Pagos</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Fecha Impuesto Circulación</label>
                    <input type="date" value={formData.taxDate} onChange={e => setFormData({...formData, taxDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Importe Impuesto (€)</label>
                    <input type="number" value={formData.taxAmount} onChange={e => setFormData({...formData, taxAmount: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Próximo Pago General</label>
                    <input type="date" value={formData.nextGeneralPayment} onChange={e => setFormData({...formData, nextGeneralPayment: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                </div>
              </section>

              {/* Insurance and Tech Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 mb-4">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-bold uppercase text-sm tracking-wider">Seguro y Documentación</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Coste Anual Seguro (€)</label>
                    <input type="number" value={formData.insuranceCost} onChange={e => setFormData({...formData, insuranceCost: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Vencimiento Seguro</label>
                    <input type="date" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Vencimiento ITV</label>
                    <input type="date" value={formData.itvDate} onChange={e => setFormData({...formData, itvDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Consumo (L/100km)</label>
                    <input type="number" step="0.1" value={formData.baseConsumption} onChange={e => setFormData({...formData, baseConsumption: parseFloat(e.target.value)})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                </div>
              </section>

              {/* Maintenance Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-orange-400 mb-4">
                  <Wrench className="w-5 h-5" />
                  <h3 className="font-bold uppercase text-sm tracking-wider">Mantenimiento</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Último Mantenimiento</label>
                    <input type="date" value={formData.lastMaintenance} onChange={e => setFormData({...formData, lastMaintenance: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Próximo Mantenimiento</label>
                    <input type="date" value={formData.nextMaintenance} onChange={e => setFormData({...formData, nextMaintenance: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Estado Manto.</label>
                    <select value={formData.maintStatus} onChange={e => setFormData({...formData, maintStatus: e.target.value as MaintenanceStatus})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none">
                      <option value={MaintenanceStatus.UP_TO_DATE}>Al día</option>
                      <option value={MaintenanceStatus.PENDING}>Pendiente</option>
                      <option value={MaintenanceStatus.DELAYED}>Atrasado</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs text-slate-400">Notas de Mantenimiento Detalladas</label>
                    <textarea value={formData.maintNotes} onChange={e => setFormData({...formData, maintNotes: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 h-24 resize-none outline-none focus:ring-1 focus:ring-blue-500" placeholder="Historial de reparaciones, cambios de filtros..." />
                  </div>
                </div>
              </section>

              {/* Loan Section */}
              <section className="bg-slate-800/30 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Financiación / Préstamo</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Activo</span>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      checked={formData.loan?.active} 
                      onChange={e => setFormData({...formData, loan: {...formData.loan!, active: e.target.checked}})} 
                    />
                  </div>
                </div>
                {formData.loan?.active && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Total Financiado (€)</label>
                      <input type="number" value={formData.loan?.totalAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, totalAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Cuota Mensual (€)</label>
                      <input type="number" value={formData.loan?.monthlyFee} onChange={e => setFormData({...formData, loan: {...formData.loan!, monthlyFee: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Monto Restante (€)</label>
                      <input type="number" value={formData.loan?.remainingAmount} onChange={e => setFormData({...formData, loan: {...formData.loan!, remainingAmount: parseFloat(e.target.value)}})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 outline-none" />
                    </div>
                  </div>
                )}
              </section>
              
              <div className="pt-6 border-t border-slate-800 flex justify-end gap-4 shrink-0">
                <button type="button" onClick={closeModal} className="bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-xl transition-colors font-medium">Cancelar</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
