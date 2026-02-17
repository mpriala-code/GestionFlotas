
import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Fuel, Save, AlertCircle, 
  Plus, TrendingDown, ArrowRight, Download, Upload, Cloud, Link, Copy, RefreshCw,
  History, Trash2, Calendar, RotateCcw
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
  onResetToFactory?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  priceHistory, setPriceHistory, isAdmin, syncId, setSyncId, onImportJSON, fullState, onResetToFactory 
}) => {
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

    const record: PriceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: newRecord.date as string,
      endDate: newRecord.endDate || undefined,
      fuelPrice: newRecord.fuelPrice as number,
      costPerKm: newRecord.costPerKm as number
    };

    setPriceHistory(prev => [record, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setNewRecord(prev => ({ ...prev, endDate: '' }));
    alert("Tarifa añadida.");
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
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cloud Sync Database Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Cloud className="w-24 h-24 text-blue-500" />
          </div>
          
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            Sincronización Cloud
          </h3>
          
          <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl">
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1">ID de Sincronización Activo</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-mono font-bold text-white tracking-tighter">{syncId || 'GLOBAL'}</p>
              <button onClick={() => { navigator.clipboard.writeText(syncId); alert("Código copiado."); }} className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-400 transition-colors">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">Zona de Peligro</h4>
            <button 
              onClick={onResetToFactory}
              className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-5 h-5" />
              Reiniciar Datos a Cero
            </button>
            <p className="text-[10px] text-slate-500 text-center italic">Esto restaurará los vehículos y trabajadores de ejemplo iniciales.</p>
          </div>
        </div>

        {/* Pricing Management Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 flex flex-col shadow-xl">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            Tarifas de Combustible
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Gasoil (€/L)</label>
              <input type="number" step="0.001" value={newRecord.fuelPrice} onChange={(e) => setNewRecord({ ...newRecord, fuelPrice: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Coste KM (€)</label>
              <input type="number" step="0.01" value={newRecord.costPerKm} onChange={(e) => setNewRecord({ ...newRecord, costPerKm: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 font-bold outline-none" />
            </div>
          </div>
          <button onClick={handleAddRecord} className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all">
            Guardar Nueva Tarifa
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Histórico de Tarifas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/30 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Fecha Inicio</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Gasoil</th>
                <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Operativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {priceHistory.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{p.date}</td>
                  <td className="px-6 py-4 font-bold text-green-400">{p.fuelPrice.toFixed(3)} €</td>
                  <td className="px-6 py-4 font-bold text-blue-400">{p.costPerKm.toFixed(2)} €</td>
                </tr>
              ))}
              {priceHistory.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">Usando tarifas por defecto (1.70€/L).</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;
