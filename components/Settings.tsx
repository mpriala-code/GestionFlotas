
import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Fuel, Save, AlertCircle, 
  Plus, TrendingDown, ArrowRight, Download, Upload, Cloud, Link, Copy, RefreshCw, Loader2
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
  const [isGenerating, setIsGenerating] = useState(false);
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
    alert("Tarifa añadida con éxito.");
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

  const generateSyncId = async () => {
    if (!isAdmin) return;
    if (!confirm("Se va a crear una nueva Base de Datos en la nube con tus datos actuales. Esto te dará un código para conectar otros dispositivos. ¿Continuar?")) return;

    setIsGenerating(true);
    try {
      // npoint.io requiere un POST a / para crear un nuevo bin
      const response = await fetch('https://api.npoint.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullState)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          setSyncId(data.id);
          alert(`¡Base de Datos Creada! Tu código es: ${data.id}. Guárdalo bien.`);
        }
      } else {
        throw new Error("Error del servidor");
      }
    } catch (err) {
      alert("Error al conectar con la nube. Reintenta en unos segundos.");
    } finally {
      setIsGenerating(false);
    }
  };

  const connectToSyncId = () => {
    if (!inputSyncId) return;
    if (confirm(`¿Conectar a la Base de Datos "${inputSyncId}"? Se borrarán tus datos locales actuales para cargar los de la nube.`)) {
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
          <p className="text-slate-400 text-sm">Control de costes y gestión de base de datos global</p>
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
                  if (confirm("¿Restaurar copia de seguridad?")) onImportJSON?.(json);
                } catch(e) { alert("Archivo JSON no válido"); }
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
            Sincronización en la Nube
          </h3>
          
          <p className="text-sm text-slate-400">
            Crea una base de datos centralizada para que todos tus empleados vean los mismos vehículos, obras y registros en tiempo real desde cualquier dispositivo.
          </p>

          {!syncId ? (
            <div className="space-y-4">
              <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl">
                <p className="text-[10px] text-blue-400 font-bold mb-3 uppercase tracking-wider">Paso 1: Crear Base de Datos Nueva</p>
                <button 
                  onClick={generateSyncId} 
                  disabled={isGenerating || !isAdmin}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> 
                      Generar Código de Acceso
                    </>
                  )}
                </button>
                {!isAdmin && <p className="text-[10px] text-red-400 mt-2 text-center font-medium">Solo disponible para Administrador</p>}
              </div>
              <div className="bg-slate-800/50 p-5 rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">Paso 2: Conectar dispositivo existente</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Escribe el código aquí..." 
                    value={inputSyncId}
                    onChange={(e) => setInputSyncId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={connectToSyncId} className="bg-slate-700 hover:bg-slate-600 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors">
                    <Link className="w-3 h-3" /> Conectar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-2">Tu Código de Acceso Global</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-mono font-bold text-white tracking-tighter">{syncId}</p>
                  <button onClick={() => { navigator.clipboard.writeText(syncId); alert("Código copiado al portapapeles."); }} className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-400 transition-colors">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-4 italic">Cualquier persona con este código podrá ver y sincronizar los datos de la flota.</p>
              </div>
              <button onClick={() => { if(confirm('¿Desconectar de la nube? Los datos volverán a ser solo locales en este navegador.')) setSyncId(''); }} className="w-full text-xs text-red-500 font-bold uppercase hover:underline py-2">
                Desactivar Sincronización
              </button>
            </div>
          )}
        </div>

        {/* Tarifas Operativas Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            Tarifas y Costes de Flota
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Gasoil (€/L)</label>
              <input type="number" step="0.001" disabled={!isAdmin} value={newRecord.fuelPrice} onChange={(e) => setNewRecord({ ...newRecord, fuelPrice: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Operativa KM (€)</label>
              <input type="number" step="0.01" disabled={!isAdmin} value={newRecord.costPerKm} onChange={(e) => setNewRecord({ ...newRecord, costPerKm: parseFloat(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 font-bold outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Vigencia desde</label>
            <input type="date" disabled={!isAdmin} value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm outline-none" />
          </div>
          {isAdmin && (
            <button onClick={handleAddRecord} className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Actualizar Precios Globales
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 p-6 rounded-3xl border border-dashed border-slate-700 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-slate-500 shrink-0 mt-1" />
        <div className="text-slate-500 text-sm italic space-y-2">
          <p><strong>Nota importante:</strong> Al generar un código, se crea un espacio privado en la nube. Todos los cambios que realices se guardarán automáticamente y se verán en cualquier otro dispositivo conectado con ese mismo código.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
