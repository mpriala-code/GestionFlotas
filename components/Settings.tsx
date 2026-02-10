
import React, { useState, useMemo } from 'react';
import { Settings as SettingsIcon, Fuel, Ruler, Save, RefreshCw, AlertCircle, Plus, Trash2, Calendar, TrendingDown, Table, ArrowRight } from 'lucide-react';
import { PriceRecord } from '../types';

interface SettingsProps {
  priceHistory: PriceRecord[];
  setPriceHistory: React.Dispatch<React.SetStateAction<PriceRecord[]>>;
  isAdmin: boolean;
}

const Settings: React.FC<SettingsProps> = ({ priceHistory, setPriceHistory, isAdmin }) => {
  const [newRecord, setNewRecord] = useState<Partial<PriceRecord>>({
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    fuelPrice: 1.70,
    costPerKm: 0.15
  });

  const handleAddRecord = () => {
    if (!isAdmin) return;
    if (!newRecord.date || !newRecord.fuelPrice || !newRecord.costPerKm) {
      alert("Por favor, completa los campos obligatorios (Fecha Inicio, Gasoil y Coste KM).");
      return;
    }

    if (newRecord.endDate && newRecord.endDate < newRecord.date) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    const record: PriceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: newRecord.date,
      endDate: newRecord.endDate || undefined,
      fuelPrice: newRecord.fuelPrice,
      costPerKm: newRecord.costPerKm
    };

    setPriceHistory(prev => [...prev, record].sort((a, b) => b.date.localeCompare(a.date)));
    alert("Nueva tarifa añadida correctamente.");
  };

  const removeRecord = (id: string) => {
    if (priceHistory.length <= 1) {
      alert("Debe haber al menos un registro de precios en el sistema.");
      return;
    }
    if (confirm("¿Seguro que quieres eliminar esta tarifa histórica?")) {
      setPriceHistory(prev => prev.filter(p => p.id !== id));
    }
  };

  const activePrice = priceHistory[0]; // Assuming sorted desc

  // Filter records from the last 3 months for the requested history display
  const last3MonthsRecords = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return priceHistory.filter(p => new Date(p.date) >= threeMonthsAgo);
  }, [priceHistory]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Ajustes de Costes y Tarifas
          </h2>
          <p className="text-slate-400 text-sm">Configuración avanzada de precios operativos por intervalos</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-3 text-yellow-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Solo los administradores pueden modificar estas tarifas. Inicia sesión como administrador.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Active Price Card */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-8 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
          <TrendingDown className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500/10" />
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
            <RefreshCw className="w-4 h-4" /> Tarifa Actual
          </h3>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Gasoil</p>
              <p className="text-4xl font-bold text-white">{activePrice?.fuelPrice.toFixed(3)} <span className="text-xl text-slate-400 font-normal">€/L</span></p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Operativo KM</p>
              <p className="text-2xl font-bold text-white">{activePrice?.costPerKm.toFixed(2)} <span className="text-lg text-slate-400 font-normal">€/km</span></p>
            </div>
            <div className="pt-2">
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 font-bold">
                Intervalo: {activePrice?.date} {activePrice?.endDate ? `hasta ${activePrice.endDate}` : '(Indefinido)'}
              </span>
            </div>
          </div>
        </div>

        {/* Add New Record Form */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold">Actualizar Tarifas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Intervalo de Fecha</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500 uppercase mb-1">Desde</p>
                  <input 
                    type="date"
                    disabled={!isAdmin}
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 mt-4" />
                <div className="flex-1">
                  <p className="text-[9px] text-slate-500 uppercase mb-1">Hasta (opcional)</p>
                  <input 
                    type="date"
                    disabled={!isAdmin}
                    value={newRecord.endDate}
                    onChange={(e) => setNewRecord({ ...newRecord, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Gasoil (€/L)</label>
                <input 
                  type="number"
                  step="0.001"
                  disabled={!isAdmin}
                  value={newRecord.fuelPrice}
                  onChange={(e) => setNewRecord({ ...newRecord, fuelPrice: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-bold text-green-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">KM (€/km)</label>
                <input 
                  type="number"
                  step="0.01"
                  disabled={!isAdmin}
                  value={newRecord.costPerKm}
                  onChange={(e) => setNewRecord({ ...newRecord, costPerKm: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-bold text-blue-400"
                />
              </div>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={handleAddRecord}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Publicar Intervalo de Tarifa
            </button>
          )}
        </div>
      </div>

      {/* 3 Months History Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Table className="w-5 h-5 text-blue-500" />
          Historial de los últimos 3 meses
        </h3>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Intervalo Efectivo</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Gasoil (€/L)</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Coste KM (€/km)</th>
                {isAdmin && <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Control</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {last3MonthsRecords.map((p, i) => (
                <tr key={p.id} className={`hover:bg-slate-800/30 transition-colors ${i === 0 ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-slate-200">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <div className="flex items-center gap-2">
                        <span>{p.date}</span>
                        {p.endDate && (
                          <>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span>{p.endDate}</span>
                          </>
                        )}
                        {!p.endDate && i === 0 && <span className="text-[9px] text-slate-500 font-normal italic ml-2">(En adelante)</span>}
                      </div>
                      {i === 0 && <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded uppercase font-black">Activo</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-green-400 font-mono text-base">{p.fuelPrice.toFixed(3)}</td>
                  <td className="px-6 py-4 text-blue-400 font-mono text-base">{p.costPerKm.toFixed(2)}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeRecord(p.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {last3MonthsRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No hay registros en los últimos 3 meses.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Full History */}
      <details className="group">
        <summary className="list-none cursor-pointer flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors py-2 px-4 bg-slate-900/30 rounded-lg border border-slate-800/50 w-fit">
          <Calendar className="w-4 h-4" />
          Ver historial completo ({priceHistory.length} registros)
        </summary>
        <div className="mt-4 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden p-4">
          <ul className="space-y-2">
            {priceHistory.map(p => (
              <li key={p.id} className="flex justify-between items-center text-xs p-2 border-b border-slate-800 last:border-0">
                <span className="text-slate-400 font-mono">{p.date} {p.endDate ? `-> ${p.endDate}` : '-> Indef.'}</span>
                <span className="font-mono text-slate-200">{p.fuelPrice.toFixed(3)} €/L | {p.costPerKm.toFixed(2)} €/km</span>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <div className="bg-slate-900/40 p-6 rounded-3xl border border-dashed border-slate-700 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-1" />
        <div className="text-slate-500 text-sm italic space-y-2">
          <p><strong>Gestión de Intervalos:</strong> Puedes definir periodos específicos para una tarifa. Si un viaje cae dentro de un intervalo (entre fecha inicio y fin), se aplicará esa tarifa.</p>
          <p>Si no hay intervalo definido para una fecha, el sistema buscará la tarifa con la fecha de inicio más reciente anterior al viaje.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
