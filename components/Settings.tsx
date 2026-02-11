
import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Fuel, Save, AlertCircle, 
  Plus, TrendingDown, ArrowRight, Download, Upload, Cloud, Link, Copy, RefreshCw,
  History, Trash2, Calendar
} from 'lucide-react';
import { PriceRecord } from '../types';

interface SettingsProps {
  priceHistory: PriceRecord[];
  setPriceHistory: React.Dispatch<React.SetStateAction<PriceRecord[]>>;
  isAdmin: boolean;
  syncId: string;
  setSyncId: (id: string) => void;
  onImportJSON?: (data: any) => void;
  fullState?: any;
}

const Settings: React.FC<SettingsProps> = ({ priceHistory, setPriceHistory, isAdmin, syncId, setSyncId, onImportJSON, fullState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputSyncId, setInputSyncId] = useState('');
  const [newRecord, setNewRecord] = useState<Partial<PriceRecord>>({
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    fuelPrice: 1.70,
    costPerKm: 0.15
  });

  const handleAddRecord = () => {
    if (!isAdmin) return;
    if (!newRecord.date || !newRecord.fuelPrice || !newRecord.costPerKm) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }

    if (newRecord.endDate && newRecord.endDate < newRecord.date) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    const record: PriceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: newRecord.date as string,
      endDate: newRecord.endDate || undefined,
      fuelPrice: newRecord.fuelPrice as number,
      costPerKm: newRecord.costPerKm as number
    };

    setPriceHistory(prev => [record, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    
    // Reset form partially
    setNewRecord(prev => ({
      ...prev,
      endDate: ''
    }));
    
    alert("Tarifa añadida al histórico.");
  };

  const deletePriceRecord = (id: string) => {
    if (!isAdmin) return;
    if (priceHistory.length <= 1) {
      alert("Debe haber al menos una tarifa configurada en el sistema.");
      return;
    }
    if (confirm('¿Estás seguro de que quieres eliminar esta tarifa? Los registros vinculados a este periodo podrían verse afectados en los cálculos de costes.')) {
      setPriceHistory(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `FleetMaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const generateSyncId = () => {
    const newId = Math.random().toString(36).substr(2, 10);
    if (confirm(`Se va a generar una nueva Base de Datos en la nube. Tu Código de Acceso será: ${newId}. ¿Deseas continuar?`)) {
      setSyncId(newId);
    }
  };

  const connectToSyncId = () => {
    if (!inputSyncId) return;
    if (confirm(`¿Conectar a la Base de Datos "${inputSyncId}"? Esto sobrescribirá tus datos locales por los de la nube.`)) {
      setSyncId(inputSyncId);
      setInputSyncId('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Configuración del Sistema
          </h2>
          <p className="text-slate-400 text-sm">Gestión de costes operativos y base de datos global</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportJSON}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-slate-700 text-xs"
            >
              <Download className="w-4 h-4 text-blue-400" />
              Backup JSON
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
              const file = e.target.files?.[0];
              if(!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                try {
                  const json = JSON.parse(evt.target?.result as string);
                  if (confirm("¿Restaurar copia? Se perderán los datos actuales no guardados.")) onImportJSON?.(json);
                } catch(e) { alert("Error al leer el archivo JSON."); }
              };
              reader.readAsText(file);
            }} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-slate-700 text-xs"
            >
              <Upload className="w-4 h-4 text-green-400" />
              Importar JSON
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cloud Sync Database Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Cloud className="w-24 h-24 text-blue-500" />
          </div>
          
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            Sincronización Multi-dispositivo
          </h3>
          
          <p className="text-sm text-slate-400">
            Conecta todos tus dispositivos a una única base de datos para que los conductores vean la misma información en tiempo real.
          </p>

          {!syncId ? (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                <p className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-widest">Opción A: Crear nueva base de datos</p>
                <button onClick={generateSyncId} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" /> Generar Código de Acceso
                </button>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-widest">Opción B: Conectar a una existente</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Introduce código..." 
                    value={inputSyncId}
                    onChange={(e) => setInputSyncId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={connectToSyncId} className="bg-slate-700 hover:bg-slate-600 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                    <Link className="w-3 h-3" /> Conectar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl">
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1">Tu Código de Acceso Global</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-mono font-bold text-white tracking-tighter">{syncId}</p>
                  <button onClick={() => { navigator.clipboard.writeText(syncId); alert("Código copiado al portapapeles."); }} className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-400 transition-colors">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 italic">Comparte este código con otros dispositivos para sincronizar la información.</p>
              </div>
              <button onClick={() => { if(confirm('¿Desconectar la sincronización? Los datos volverán a ser solo locales en este dispositivo.')) setSyncId(''); }} className="w-full text-xs text-red-500 font-bold uppercase hover:underline">
                Detener Sincronización
              </button>
            </div>
          )}
        </div>

        {/* Pricing Management Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            Configurar Nueva Tarifa
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Gasoil (€/L)</label>
              <input type="number" step="0.001" disabled={!isAdmin} value={newRecord.fuelPrice} onChange={(e) => setNewRecord({ ...newRecord, fuelPrice: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none focus:ring-1 focus:ring-green-500/30" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Coste KM (€)</label>
              <input type="number" step="0.01" disabled={!isAdmin} value={newRecord.costPerKm} onChange={(e) => setNewRecord({ ...newRecord, costPerKm: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 font-bold outline-none focus:ring-1 focus:ring-blue-500/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Fecha Inicio</label>
              <input type="date" disabled={!isAdmin} value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Fecha Fin <span className="text-[10px] lowercase font-normal">(opcional)</span></label>
              <input type="date" disabled={!isAdmin} value={newRecord.endDate} onChange={(e) => setNewRecord({ ...newRecord, endDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" />
            </div>
          </div>
          {isAdmin && (
            <button onClick={handleAddRecord} className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-[0.98]">
              Añadir al Histórico de Precios
            </button>
          )}
        </div>
      </div>

      {/* Price History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Histórico de Tarifas Dinámicas
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{priceHistory.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/30 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Desde</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Hasta</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Gasoil (€/L)</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Operativo (€/KM)</th>
                {isAdmin && <th className="px-6 py-4 text-right"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {priceHistory.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4 text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {p.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {p.endDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {p.endDate}
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-blue-500/80 bg-blue-500/10 px-2 py-0.5 rounded">Vigente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-400">
                    {p.fuelPrice.toFixed(3)} €
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-400">
                    {p.costPerKm.toFixed(2)} €
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deletePriceRecord(p.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar tarifa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {priceHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No hay tarifas configuradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-3xl border border-dashed border-slate-700 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-1" />
        <div className="text-slate-500 text-sm italic space-y-2">
          <p><strong>Nota sobre intervalos de precios:</strong> El sistema utiliza estos registros para calcular el gasto real de los viajes según su fecha. Si un viaje cae dentro de un intervalo (Fecha Inicio ≤ Fecha Viaje ≤ Fecha Fin), se aplicará esa tarifa específica. Si no hay fecha de fin, se considera vigente desde su inicio.</p>
          <p><strong>Sincronización:</strong> Los cambios en las tarifas se replican instantáneamente a todos los dispositivos conectados bajo el mismo código de acceso.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
