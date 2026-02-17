
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Truck, ClipboardList, BarChart3, 
  RefreshCw, Database, Settings as SettingsIcon 
} from 'lucide-react';

import { 
  Vehicle, Worker, Work, LogEntry, TabType, PriceRecord 
} from './types';
import { 
  INITIAL_VEHICLES, INITIAL_WORKERS, INITIAL_WORKS, INITIAL_LOGS 
} from './constants';
import { cloudApi } from './api';

import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Logs from './components/Logs';
import Stats from './components/Stats';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [syncId, setSyncId] = useState<string>(() => localStorage.getItem('fleet_sync_id') || 'GLOBAL');

  // Estados de la aplicación - Se inician con los datos de constantes por defecto
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [works, setWorks] = useState<Work[]>(INITIAL_WORKS);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>([]);

  const isInitialLoad = useRef(true);

  // Carga de datos desde la nube
  const loadCloudData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await cloudApi.getGlobalData();
      if (result && result.data) {
        setVehicles(result.data.vehicles || INITIAL_VEHICLES);
        setWorkers(result.data.workers || INITIAL_WORKERS);
        setWorks(result.data.works || INITIAL_WORKS);
        setLogs(result.data.logs || INITIAL_LOGS);
        setPriceHistory(result.data.priceHistory || []);
        setSyncStatus('synced');
      } else {
        // Si no hay datos en la nube, mantenemos los iniciales
        setSyncStatus('synced');
      }
    } catch (e) {
      console.error("Error cargando datos:", e);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
      // Pequeño delay para asegurar que el flag de carga inicial no corte el primer guardado
      setTimeout(() => { isInitialLoad.current = false; }, 800);
    }
  }, []);

  useEffect(() => {
    loadCloudData();
  }, [loadCloudData]);

  // Guardado automático al cambiar cualquier estado (Debounced)
  useEffect(() => {
    if (isInitialLoad.current || isLoading) return;

    setSyncStatus('syncing');
    const saveData = async () => {
      try {
        await cloudApi.saveGlobalData({
          vehicles, workers, works, logs, priceHistory
        });
        setSyncStatus('synced');
      } catch (e) {
        setSyncStatus('error');
      }
    };

    const timeout = setTimeout(saveData, 2000);
    return () => clearTimeout(timeout);
  }, [vehicles, workers, works, logs, priceHistory, isLoading]);

  // Función para resetear todo a inicio
  const handleResetToFactory = () => {
    if (window.confirm("¿ESTÁS SEGURO? Esto borrará todos los datos actuales y restaurará la configuración de inicio (demo).")) {
      setVehicles(INITIAL_VEHICLES);
      setWorkers(INITIAL_WORKERS);
      setWorks(INITIAL_WORKS);
      setLogs(INITIAL_LOGS);
      setPriceHistory([]);
      setActiveTab('dashboard');
      alert("Datos restaurados. Se sincronizarán automáticamente con la nube.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-white font-black text-xl tracking-tighter mb-2">FleetMaster AI</h2>
          <p className="text-blue-400 font-bold tracking-widest text-[10px] uppercase animate-pulse">Iniciando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20"><Database className="w-5 h-5 text-white" /></div>
             <div>
               <h1 className="text-xl font-bold tracking-tight">FleetMaster AI</h1>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {syncStatus === 'synced' ? 'Base de Datos Lista' : syncStatus === 'error' ? 'Error de Conexión' : 'Sincronizando...'}
                  </p>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadCloudData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-95"
              title="Refrescar desde la nube"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-4 flex overflow-x-auto no-scrollbar gap-2 px-1">
          {[
            {id:'dashboard',label:'Inicio',icon:LayoutDashboard}, 
            {id:'vehicles',label:'Flota',icon:Truck}, 
            {id:'logs',label:'Viajes',icon:ClipboardList}, 
            {id:'stats',label:'Estadísticas',icon:BarChart3}, 
            {id:'settings',label:'Ajustes',icon:SettingsIcon}
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs whitespace-nowrap ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
        {activeTab === 'dashboard' && <Dashboard vehicles={vehicles} workers={workers} works={works} logs={logs} alerts={[]} priceHistory={priceHistory} />}
        {activeTab === 'vehicles' && <Vehicles vehicles={vehicles} setVehicles={setVehicles} isAdmin={true} />}
        {activeTab === 'logs' && <Logs logs={logs} setLogs={setLogs} vehicles={vehicles} setVehicles={setVehicles} workers={workers} works={works} isAdmin={true} currentUser={null} />}
        {activeTab === 'stats' && <Stats logs={logs} vehicles={vehicles} workers={workers} works={works} priceHistory={priceHistory} />}
        {activeTab === 'settings' && (
          <Settings 
            priceHistory={priceHistory} 
            setPriceHistory={setPriceHistory} 
            isAdmin={true} 
            syncId={syncId} 
            setSyncId={(id) => { setSyncId(id); localStorage.setItem('fleet_sync_id', id); }} 
            fullState={{vehicles, workers, works, logs, priceHistory}} 
            onResetToFactory={handleResetToFactory}
          />
        )}
      </main>

      <footer className="p-8 text-center opacity-20 border-t border-slate-900 mt-12">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">FleetMaster AI • Modo Inicio Activo</p>
      </footer>
    </div>
  );
};

export default App;
