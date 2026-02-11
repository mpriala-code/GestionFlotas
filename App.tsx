
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { 
  Vehicle, Worker, Work, LogEntry, TabType, 
  MaintenanceStatus, WorkStatus, PriceRecord, AuthRole
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
  
  // Persistencia local
  const [role, setRole] = useState<AuthRole>(() => getStorageItem('fleet_role', 'none'));
  const [currentUser, setCurrentUser] = useState<Worker | null>(() => getStorageItem('fleet_current_user', null));
  const [syncId, setSyncId] = useState<string>(() => getStorageItem('fleet_sync_id', ''));
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
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

  // --- LOGICA DE NUBE (npoint.io) ---

  const pushToCloud = useCallback(async (currentSyncId: string, data: any) => {
    if (!currentSyncId) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`https://api.npoint.io/${currentSyncId}`, {
        method: 'POST', // POST en npoint actualiza si el bin ya existe
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.error("Error al sincronizar datos:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const pullFromCloud = useCallback(async (currentSyncId: string) => {
    if (!currentSyncId) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`https://api.npoint.io/${currentSyncId}`);
      if (response.ok) {
        const remoteData = await response.json();
        if (remoteData.vehicles) setVehicles(remoteData.vehicles);
        if (remoteData.workers) setWorkers(remoteData.workers);
        if (remoteData.works) setWorks(remoteData.works);
        if (remoteData.logs) setLogs(remoteData.logs);
        if (remoteData.priceHistory) setPriceHistory(remoteData.priceHistory);
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.error("Error al descargar datos:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sincronización inicial al conectar
  useEffect(() => {
    if (syncId) {
      pullFromCloud(syncId);
    }
  }, [syncId]);

  // Guardado local instantáneo
  useEffect(() => { localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('fleet_workers', JSON.stringify(workers)); }, [workers]);
  useEffect(() => { localStorage.setItem('fleet_works', JSON.stringify(works)); }, [works]);
  useEffect(() => { localStorage.setItem('fleet_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('fleet_price_history', JSON.stringify(priceHistory)); }, [priceHistory]);
  useEffect(() => {
    localStorage.setItem('fleet_role', JSON.stringify(role));
    localStorage.setItem('fleet_current_user', JSON.stringify(currentUser));
    localStorage.setItem('fleet_sync_id', JSON.stringify(syncId));
  }, [role, currentUser, syncId]);

  // Subida automática a la nube (solo Admin, cada 5 segundos si hay cambios)
  useEffect(() => {
    if (syncId && isAdmin) {
      const timeout = setTimeout(() => {
        pushToCloud(syncId, { vehicles, workers, works, logs, priceHistory });
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [vehicles, workers, works, logs, priceHistory, syncId, isAdmin, pushToCloud]);

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
        setRole('admin'); setCurrentUser(null); setShowLoginModal(false);
      } else alert('Error: Credenciales de administrador incorrectas.');
    } else {
      const found = workers.find(w => w.username === loginUsername && w.password === loginPassword);
      if (found) {
        setRole('worker'); setCurrentUser(found); setShowLoginModal(false);
      } else alert('Error: Usuario o contraseña de trabajador incorrectos.');
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
    if (role === 'none') return items.filter(i => i.id === 'dashboard');
    return items;
  }, [role]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg"><Truck className="w-5 h-5 text-white" /></div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent leading-tight">FleetMaster AI</h1>
              {syncId && (
                <div className="flex items-center gap-1 text-[9px] text-green-400 uppercase font-bold tracking-widest">
                  <Cloud className="w-2.5 h-2.5 animate-pulse" />
                  Sincronización Activa
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncId && (
              <button 
                onClick={() => pullFromCloud(syncId)}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                  {isSyncing ? 'Sincronizando...' : lastSyncTime ? `Hoy, ${lastSyncTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Actualizado'}
                </span>
                <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {role === 'none' ? (
              <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold shadow-lg">Acceder</button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-xs font-bold">{role === 'admin' ? 'Administrador' : currentUser?.name}</span>
                  <span className="text-[9px] text-slate-500 uppercase">{role}</span>
                </div>
                <button onClick={() => { if(confirm('¿Cerrar sesión?')) setRole('none'); }} className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"><LogOut className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 border-t border-slate-800 flex overflow-x-auto no-scrollbar">
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
          }} 
          fullState={{vehicles, workers, works, logs, priceHistory}} 
        />}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full animate-in zoom-in-95">
            <h2 className="text-2xl font-bold mb-6 text-center">Identificación de Usuario</h2>
            <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
              <button onClick={() => setLoginType('worker')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${loginType === 'worker' ? 'bg-blue-600' : 'text-slate-400'}`}>Trabajador</button>
              <button onClick={() => setLoginType('admin')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${loginType === 'admin' ? 'bg-blue-600' : 'text-slate-400'}`}>Admin</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input required value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" placeholder="Usuario" />
              <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" placeholder="Contraseña" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 bg-slate-800 py-3 rounded-xl">Cerrar</button>
                <button type="submit" className="flex-1 bg-blue-600 py-3 rounded-xl font-bold">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
