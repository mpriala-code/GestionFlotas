
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  HardHat, 
  ClipboardList, 
  BarChart3, 
  Wrench, 
  LogIn, 
  LogOut,
  Bell,
  Plus,
  AlertTriangle,
  Settings as SettingsIcon,
  UserCircle,
  ShieldCheck,
  Share2,
  Cloud,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff,
  Lock
} from 'lucide-react';
import { 
  Vehicle, Worker, Work, LogEntry, TabType, 
  MaintenanceStatus, WorkStatus, TripType, PriceRecord, AuthRole
} from './types';
import { 
  INITIAL_VEHICLES, INITIAL_WORKERS, INITIAL_WORKS, INITIAL_LOGS 
} from './constants';

import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Workers from './components/Workers';
import Works from './components/Works';
import Logs from './components/Logs';
import Stats from './components/Stats';
import Maintenance from './components/Maintenance';
import Settings from './components/Settings';

declare const LZString: any;

export interface Alert {
  id: string;
  plate: string;
  model: string;
  reason: string;
  type: 'warning' | 'danger';
}

const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return defaultValue;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Persisted local state
  const [role, setRole] = useState<AuthRole>(() => getStorageItem('fleet_role', 'none'));
  const [currentUser, setCurrentUser] = useState<Worker | null>(() => getStorageItem('fleet_current_user', null));
  const [syncId, setSyncId] = useState<string>(() => getStorageItem('fleet_sync_id', ''));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const [loginType, setLoginType] = useState<AuthRole>('worker');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>(() => 
    getStorageItem('fleet_price_history', [
      { id: 'p_now', date: new Date().toISOString().split('T')[0], fuelPrice: 1.70, costPerKm: 0.15 }
    ])
  );
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStorageItem('fleet_vehicles', INITIAL_VEHICLES));
  const [workers, setWorkers] = useState<Worker[]>(() => getStorageItem('fleet_workers', INITIAL_WORKERS));
  const [works, setWorks] = useState<Work[]>(() => getStorageItem('fleet_works', INITIAL_WORKS));
  const [logs, setLogs] = useState<LogEntry[]>(() => getStorageItem('fleet_logs', INITIAL_LOGS));

  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';
  
  // Track timestamps for LWW (Last Write Wins) strategy
  const lastUpdateRef = useRef<number>(Number(localStorage.getItem('fleet_last_updated') || Date.now()));

  // --- CLOUD SYNC LOGIC ---

  const pullFromCloud = useCallback(async (currentSyncId: string, quiet = false) => {
    if (!currentSyncId) return;
    if (!quiet) setIsSyncing(true);
    try {
      const response = await fetch(`https://api.npoint.io/${currentSyncId}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const remoteData = await response.json();
        // Solo actualizamos si los datos remotos son realmente más nuevos
        if (remoteData.lastUpdated && remoteData.lastUpdated > lastUpdateRef.current) {
          if (remoteData.vehicles) setVehicles(remoteData.vehicles);
          if (remoteData.workers) setWorkers(remoteData.workers);
          if (remoteData.works) setWorks(remoteData.works);
          if (remoteData.logs) setLogs(remoteData.logs);
          if (remoteData.priceHistory) setPriceHistory(remoteData.priceHistory);
          
          lastUpdateRef.current = remoteData.lastUpdated;
          localStorage.setItem('fleet_last_updated', remoteData.lastUpdated.toString());
          setLastSyncTime(new Date());
        }
      }
      setIsOnline(true);
    } catch (e) {
      console.error("Error descargando de la nube:", e);
      setIsOnline(false);
    } finally {
      if (!quiet) setIsSyncing(false);
    }
  }, []);

  const pushToCloud = useCallback(async (currentSyncId: string, data: any) => {
    if (!currentSyncId) return;
    setIsSyncing(true);
    try {
      const timestamp = Date.now();
      const payload = { ...data, lastUpdated: timestamp };
      
      const response = await fetch(`https://api.npoint.io/${currentSyncId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        lastUpdateRef.current = timestamp;
        localStorage.setItem('fleet_last_updated', timestamp.toString());
        setLastSyncTime(new Date());
        setIsOnline(true);
      }
    } catch (e) {
      console.error("Error sincronizando con la nube:", e);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync initialization
  useEffect(() => {
    if (syncId && role !== 'none') {
      pullFromCloud(syncId);
    }
  }, [syncId, pullFromCloud, role]);

  // AUTO-POLLING
  useEffect(() => {
    if (!syncId || role === 'none') return;
    const interval = setInterval(() => {
      pullFromCloud(syncId, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [syncId, pullFromCloud, role]);

  // Auto-save locales
  useEffect(() => {
    localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('fleet_workers', JSON.stringify(workers));
    localStorage.setItem('fleet_works', JSON.stringify(works));
    localStorage.setItem('fleet_logs', JSON.stringify(logs));
    localStorage.setItem('fleet_price_history', JSON.stringify(priceHistory));
    localStorage.setItem('fleet_role', JSON.stringify(role));
    localStorage.setItem('fleet_current_user', JSON.stringify(currentUser));
    localStorage.setItem('fleet_sync_id', JSON.stringify(syncId));
  }, [vehicles, workers, works, logs, priceHistory, role, currentUser, syncId]);

  // AUTO-PUSH
  useEffect(() => {
    if (syncId && (isAdmin || isWorker)) {
      const timeout = setTimeout(() => {
        pushToCloud(syncId, { vehicles, workers, works, logs, priceHistory });
      }, 1500); 
      return () => clearTimeout(timeout);
    }
  }, [vehicles, workers, works, logs, priceHistory, syncId, isAdmin, isWorker, pushToCloud]);

  const alerts = useMemo((): Alert[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threshold = new Date();
    threshold.setDate(today.getDate() + 30);
    const results: Alert[] = [];
    vehicles.forEach(v => {
      const checkDates = [
        { dateStr: v.itvDate, label: 'ITV' },
        { dateStr: v.insuranceExpiry, label: 'Seguro' },
        { dateStr: v.nextMaintenance, label: 'Mantenimiento' },
        { dateStr: v.taxDate, label: 'Impuesto' },
      ];
      checkDates.forEach(d => {
        if (d.dateStr) {
          const alertDate = new Date(d.dateStr);
          alertDate.setHours(0, 0, 0, 0);
          if (!isNaN(alertDate.getTime())) {
            if (alertDate < today) results.push({ id: `${v.id}-${d.label}`, plate: v.plate, model: v.model, reason: `${d.label} caducada`, type: 'danger' });
            else if (alertDate <= threshold) results.push({ id: `${v.id}-${d.label}`, plate: v.plate, model: v.model, reason: `${d.label} próximo`, type: 'warning' });
          }
        }
      });
    });
    return results;
  }, [vehicles]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === 'admin') {
      if (loginUsername === 'admin' && loginPassword === 'admin123') {
        setRole('admin'); setCurrentUser(null);
      } else alert('Error en las credenciales de administrador');
    } else {
      const found = workers.find(w => w.username === loginUsername && w.password === loginPassword);
      if (found) {
        setRole('worker'); setCurrentUser(found);
        setActiveTab('logs');
      } else alert('Error en las credenciales de trabajador');
    }
    setLoginUsername(''); setLoginPassword('');
  };

  const navItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
      { id: 'vehicles', label: 'Vehículos', icon: Truck },
      { id: 'workers', label: 'Trabajadores', icon: Users },
      { id: 'works', label: 'Obras', icon: HardHat },
      { id: 'logs', label: 'Registros', icon: ClipboardList },
      { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
      { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
      { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
    ];
    if (role === 'worker') return items.filter(i => i.id === 'logs');
    if (role === 'none') return [];
    return items;
  }, [role]);

  // Si no hay sesión iniciada, mostrar solo la pantalla de login
  if (role === 'none') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 p-6">
        <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-2xl shadow-blue-600/20 mb-4 animate-bounce">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">FleetMaster AI</h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">Sistema de Gestión de Flotas</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            
            <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-3">
              <Lock className="w-5 h-5 text-blue-500" /> Acceso al Sistema
            </h2>

            <div className="flex bg-slate-800 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => setLoginType('worker')} 
                className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${loginType === 'worker' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Trabajador
              </button>
              <button 
                onClick={() => setLoginType('admin')} 
                className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${loginType === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Usuario</label>
                <input 
                  required 
                  value={loginUsername} 
                  onChange={e => setLoginUsername(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="Introduce tu usuario..." 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Contraseña</label>
                <input 
                  required 
                  type="password" 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="Introduce tu contraseña..." 
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-[0.98] mt-4"
              >
                Iniciar Sesión
              </button>
            </form>
          </div>
          
          <p className="mt-8 text-center text-xs text-slate-600 font-medium">
            &copy; 2025 FleetMaster AI. Todos los derechos reservados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><Truck className="w-5 h-5 text-white" /></div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-tight tracking-tight">FleetMaster AI</h1>
              <div className="flex items-center gap-1.5">
                 {syncId ? (
                    <div className="flex items-center gap-1 text-[9px] text-green-400 uppercase font-bold tracking-widest">
                      <Wifi className="w-2.5 h-2.5 animate-pulse" />
                      Sincronizado
                    </div>
                 ) : (
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                      <WifiOff className="w-2.5 h-2.5" />
                      Modo Local
                    </div>
                 )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                  {isSyncing ? 'Guardando...' : isOnline ? `Nube OK: ${lastSyncTime?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Desconectado'}
                </span>
                <button 
                  onClick={() => pullFromCloud(syncId)} 
                  disabled={isSyncing}
                  className="p-1 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30" 
                  title="Refrescar datos de la nube"
                >
                  <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold">{role === 'admin' ? 'Administrador' : currentUser?.name}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">{role === 'admin' ? 'Control Total' : 'Acceso Trabajador'}</span>
              </div>
              <button onClick={() => { if(confirm('¿Cerrar sesión?')) setRole('none'); }} className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 border-t border-slate-800 flex overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === item.id ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
              {activeTab === item.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard vehicles={vehicles} workers={workers} works={works} logs={logs} alerts={alerts} priceHistory={priceHistory} />}
        {activeTab === 'vehicles' && <Vehicles vehicles={vehicles} setVehicles={setVehicles} isAdmin={isAdmin} />}
        {activeTab === 'workers' && <Workers workers={workers} setWorkers={setWorkers} isAdmin={isAdmin} />}
        {activeTab === 'works' && <Works works={works} setWorks={setWorks} isAdmin={isAdmin} />}
        {activeTab === 'logs' && <Logs logs={logs} setLogs={setLogs} vehicles={vehicles} setVehicles={setVehicles} workers={workers} works={works} isAdmin={isAdmin} currentUser={currentUser} />}
        {activeTab === 'stats' && <Stats logs={logs} vehicles={vehicles} workers={workers} works={works} priceHistory={priceHistory} />}
        {activeTab === 'maintenance' && <Maintenance vehicles={vehicles} setVehicles={setVehicles} isAdmin={isAdmin} alerts={alerts} />}
        {activeTab === 'settings' && <Settings 
          priceHistory={priceHistory} 
          setPriceHistory={setPriceHistory} 
          isAdmin={isAdmin} 
          syncId={syncId}
          setSyncId={setSyncId}
          onImportJSON={(data) => {
            if(data.vehicles) setVehicles(data.vehicles);
            if(data.workers) setWorkers(data.workers);
            if(data.works) setWorks(data.works);
            if(data.logs) setLogs(data.logs);
            if(data.priceHistory) setPriceHistory(data.priceHistory);
            if (syncId && (isAdmin || isWorker)) pushToCloud(syncId, data);
          }} 
          fullState={{vehicles, workers, works, logs, priceHistory}} 
        />}
      </main>
    </div>
  );
};

export default App;
