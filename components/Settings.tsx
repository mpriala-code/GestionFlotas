
import React, { useState, useMemo, useRef } from 'react';
import { 
  Settings as SettingsIcon, Fuel, Ruler, Save, RefreshCw, AlertCircle, 
  Plus, Trash2, Calendar, TrendingDown, Table, ArrowRight, Download, Upload 
} from 'lucide-react';
import { PriceRecord } from '../types';

interface SettingsProps {
  priceHistory: PriceRecord[];
  setPriceHistory: React.Dispatch<React.SetStateAction<PriceRecord[]>>;
  isAdmin: boolean;
  onImportJSON?: (data: any) => void;
  fullState?: any;
}

const Settings: React.FC<SettingsProps> = ({ priceHistory, setPriceHistory, isAdmin, onImportJSON, fullState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      date: newRecord.date,
      endDate: newRecord.endDate || undefined,
      fuelPrice: newRecord.fuelPrice,
      costPerKm: newRecord.costPerKm
    };
    setPriceHistory(prev => [record, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    alert("Tarifa añadida.");
  };

  const activePrice = priceHistory[0];

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `FleetMaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (confirm("¿Estás seguro de que deseas importar esta copia de seguridad completa? Se sobrescribirán todos los datos actuales de la aplicación.")) {
          if (onImportJSON) onImportJSON(json);
          alert("Base de datos restaurada con éxito.");
        }
      } catch (err) {
        alert("Error al procesar el archivo JSON.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Configuración del Sistema
          </h2>
          <p className="text-slate-400 text-sm">Gestión de costes operativos y copias de seguridad</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportJSON}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-slate-700 text-xs"
            >
              <Download className="w-4 h-4 text-blue-400" />
              Backup Completo (JSON)
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" accept=".json" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border border-slate-700 text-xs"
            >
              <Upload className="w-4 h-4 text-green-400" />
              Restaurar Sistema
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-8 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
          <TrendingDown className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500/10" />
          <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">Tarifa Actual</h3>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Gasoil</p>
              <p className="text-4xl font-bold text-white">{activePrice?.fuelPrice.toFixed(3)} <span className="text-xl text-slate-400 font-normal">€/L</span></p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase">Operativo KM</p>
              <p className="text-2xl font-bold text-white">{activePrice?.costPerKm.toFixed(2)} <span className="text-lg text-slate-400 font-normal">€/km</span></p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold">Actualizar Tarifas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Intervalo de Fecha</label>
              <div className="flex items-center gap-2">
                <input type="date" disabled={!isAdmin} value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <input type="date" disabled={!isAdmin} value={newRecord.endDate} onChange={(e) => setNewRecord({ ...newRecord, endDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Gasoil (€/L)</label>
                <input type="number" step="0.001" disabled={!isAdmin} value={newRecord.fuelPrice} onChange={(e) => setNewRecord({ ...newRecord, fuelPrice: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">KM (€/km)</label>
                <input type="number" step="0.01" disabled={!isAdmin} value={newRecord.costPerKm} onChange={(e) => setNewRecord({ ...newRecord, costPerKm: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 font-bold outline-none" />
              </div>
            </div>
          </div>
          {isAdmin && (
            <button onClick={handleAddRecord} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
              <Plus className="w-5 h-5" /> Publicar Tarifa
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-3xl border border-dashed border-slate-700 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-1" />
        <div className="text-slate-500 text-sm italic space-y-2">
          <p><strong>Nota de seguridad:</strong> Los datos se guardan automáticamente en este navegador. Al usar "Compartir" en la cabecera, generas un enlace que contiene una copia de todos tus datos actuales para que otra persona pueda cargarlos.</p>
          <p>Utiliza el <strong>Backup Completo</strong> para guardar una copia de seguridad física en tu ordenador periódicamente.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
