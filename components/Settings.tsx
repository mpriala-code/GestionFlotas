
import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Fuel, Save, AlertCircle, 
  Plus, TrendingDown, ArrowRight, Download, Upload, Cloud, Link, Copy, RefreshCw
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
    // Generamos un ID aleatorio de 8 caracteres que npoint.io acepte
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
                  if (confirm("¿Restaurar copia?")) onImportJSON?.(json);
                } catch(e) { alert("Error"); }
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
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
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
                <p className="text-xs text-blue-400 font-bold mb-2 uppercase">Opción A: Crear nueva base de datos</p>
                <button onClick={generateSyncId} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" /> Generar Código de Acceso
                </button>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold mb-2 uppercase">Opción B: Conectar a una existente</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Introduce código..." 
                    value={inputSyncId}
                    onChange={(e) => setInputSyncId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={connectToSyncId} className="bg-slate-700 hover:bg-slate-600 px-4 rounded-xl font-bold text-xs flex items-center gap-2">
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
                  <button onClick={() => { navigator.clipboard.writeText(syncId); alert("Código copiado."); }} className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-400 transition-colors">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 italic">Cualquier persona con este código podrá ver y editar tus datos.</p>
              </div>
              <button onClick={() => { if(confirm('¿Desconectar? Los datos volverán a ser locales.')) setSyncId(''); }} className="w-full text-xs text-red-500 font-bold uppercase hover:underline">
                Detener Sincronización
              </button>
            </div>
          )}
        </div>

        {/* Pricing Management Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            Tarifas Operativas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Gasoil (€/L)</label>
              <input type="number" step="0.001" disabled={!isAdmin} value={newRecord.fuelPrice} onChange={(e) => setNewRecord({ ...newRecord, fuelPrice: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Coste KM (€)</label>
              <input type="number" step="0.01" disabled={!isAdmin} value={newRecord.costPerKm} onChange={(e) => setNewRecord({ ...newRecord, costPerKm: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 font-bold outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Fecha Efectiva</label>
            <input type="date" disabled={!isAdmin} value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" />
          </div>
          {isAdmin && (
            <button onClick={handleAddRecord} className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all">
              Actualizar Precios Globales
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-3xl border border-dashed border-slate-700 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-1" />
        <div className="text-slate-500 text-sm italic space-y-2">
          <p><strong>Persistencia de Datos:</strong> Al conectar una base de datos en la nube, todos tus cambios se replican instantáneamente. Si entras desde otro dispositivo con el mismo <strong>Código de Acceso</strong>, verás exactamente lo mismo.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
