
import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Fuel, Save, AlertCircle, 
  Plus, TrendingDown, ArrowRight, Download, Upload, Cloud, Link, Copy, RefreshCw, Loader2, Database
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
  const [errorMessage, setErrorMessage] = useState('');

  const generateSyncId = async () => {
    if (!isAdmin) return;
    setErrorMessage('');
    setIsGenerating(true);
    
    try {
      // Usando JSONStorage.net
      const response = await fetch('https://api.jsonstorage.net/v1/json', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullState)
      });
      
      if (response.ok) {
        const data = await response.json();
        const uri = data.uri || '';
        const id = uri.split('/').pop();
        if (id) {
          setSyncId(id);
          alert(`¡Base de Datos Creada! Tu código global es: ${id}`);
        } else {
          throw new Error("No se pudo obtener el ID del servidor.");
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 30)}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Fallo de conexión con el servidor de la nube.');
    } finally {
      setIsGenerating(false);
    }
  };

  const connectToSyncId = () => {
    if (!inputSyncId) return;
    if (confirm(`¿Conectar a la base "${inputSyncId}"? Se sobrescribirán tus datos actuales.`)) {
      setSyncId(inputSyncId);
      setInputSyncId('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Configuración del Sistema
          </h2>
          <p className="text-slate-500 text-sm">Precios, costes operativos y sincronización global</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState));
              const node = document.createElement('a');
              node.setAttribute("href", dataStr);
              node.setAttribute("download", `Copia_Seguridad_Flota.json`);
              node.click();
            }} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-blue-400 transition-colors" title="Exportar copia local"><Download className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Sincronización */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database className="w-32 h-32 text-blue-500" />
          </div>
          
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            Sincronización Global
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed italic">
            Conecta múltiples terminales (móviles, tablets, PC) compartiendo el mismo código de acceso.
          </p>

          {!syncId ? (
            <div className="space-y-4">
              <div className="bg-blue-600/5 border border-blue-500/10 p-5 rounded-2xl space-y-4">
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Crear Nueva Base de Datos</p>
                <button 
                  onClick={generateSyncId} 
                  disabled={isGenerating || !isAdmin}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 py-3.5 rounded-xl font-bold text-xs uppercase transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {isGenerating ? 'Generando Espacio...' : 'Generar Código de Acceso'}
                </button>
                {errorMessage && <p className="text-[10px] text-red-400 text-center font-bold px-2">{errorMessage}</p>}
              </div>
              <div className="bg-slate-800/30 p-5 rounded-2xl space-y-3">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Ya tengo un código</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="ID de la base..." value={inputSyncId} onChange={(e) => setInputSyncId(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                  <button onClick={connectToSyncId} className="bg-slate-700 hover:bg-slate-600 px-4 rounded-xl text-[10px] font-bold uppercase transition-colors">Conectar</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-2xl relative">
                <div className="absolute top-4 right-4"><div className="w-2 h-2 bg-green-500 rounded-full animate-ping" /></div>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-2">Código Activo</p>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-3xl font-mono font-bold text-white tracking-tighter truncate">{syncId}</p>
                  <button onClick={() => { navigator.clipboard.writeText(syncId); alert("Código copiado al portapapeles."); }} className="p-3 bg-green-500/10 hover:bg-green-500/20 rounded-xl text-green-500 transition-colors"><Copy className="w-5 h-5" /></button>
                </div>
              </div>
              <button onClick={() => { if(confirm('¿Desactivar la sincronización en la nube?')) setSyncId(''); }} className="w-full py-2.5 text-[10px] text-red-500 font-bold uppercase hover:bg-red-500/5 rounded-xl transition-colors">
                Detener Sincronización
              </button>
            </div>
          )}
        </div>

        {/* Card Tarifas */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            Tarifas y Costes de Flota
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Gasoil (€/L)</label>
              <input type="number" step="0.001" disabled={!isAdmin} value={priceHistory[0]?.fuelPrice} onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPriceHistory(prev => [{...prev[0], fuelPrice: val}, ...prev.slice(1)]);
              }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-green-400 font-bold text-xl outline-none focus:ring-1 focus:ring-green-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Cota KM (€/km)</label>
              <input type="number" step="0.01" disabled={!isAdmin} value={priceHistory[0]?.costPerKm} onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPriceHistory(prev => [{...prev[0], costPerKm: val}, ...prev.slice(1)]);
              }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 font-bold text-xl outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          </div>
          <p className="text-xs text-slate-500 italic bg-slate-800/20 p-4 rounded-xl border border-slate-800">
            * Estos valores se utilizan para el cálculo instantáneo de rentabilidad y gasto operativo en la pestaña de Estadísticas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
