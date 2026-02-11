
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Truck, Users, HardHat, ClipboardList, BarChart3, Wrench, LogIn, LogOut,
  Wifi, WifiOff, Lock, RefreshCw, Cloud, ShieldCheck, Settings as SettingsIcon, User as UserIcon,
  Zap, PlayCircle, CheckCircle2, AlertCircle
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import { 
  Vehicle, Worker, Work, LogEntry, TabType, 
  PriceRecord, AuthRole, Alert
} from './types';
import { 
  INITIAL_VEHICLES, INITIAL_WORKERS, INITIAL_WORKS, INITIAL_LOGS 
} from './constants';
import { cloudApi } from './api';

// Component Imports
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Workers from './components/Workers';
import Works from './components/Works';
import Logs from './components/Logs';
import Stats from './components/Stats';
import Maintenance from './components/Maintenance';
import Settings from './components/Settings';

// CONFIGURACIÓN OBLIGATORIA: Pon aquí tus datos de Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abcd"
};

const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try { return JSON.parse(saved); } catch (e) { return defaultValue; }
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Flota', icon: Truck },
  { id: 'workers', label: 'Personal', icon: Users },
  { id: 'works', label: 'Obras', icon: HardHat },
  { id: 'logs', label: 'Registros', icon: ClipboardList },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { id: 'settings', label: 'Configuración', icon: SettingsIcon },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [role, setRole] = useState<AuthRole>(() => getStorageItem('fleet_role', 'none'));
  const [idToken, setIdToken] = useState<string>('');
  const [fleetId, setFleetId] = useState<string>(() => getStorageItem('fleet_id', ''));
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados de datos
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStorageItem('fleet_vehicles', INITIAL_VEHICLES));
  const [workers, setWorkers] = useState<Worker[]>(() => getStorageItem('fleet_workers', INITIAL_WORKERS));
  const [works, setWorks] = useState<Work[]>(() => getStorageItem('fleet_works', INITIAL_WORKS));
  const [logs, setLogs] = useState<LogEntry[]>(() => getStorageItem('fleet_logs', INITIAL_LOGS));
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>(() => getStorageItem('fleet_prices', [{ id: 'p_now', date: new Date().toISOString().split('T')[0], fuelPrice: 1.70, costPerKm: 0.15 }]));

  const syncTimeoutRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  // 1. Cargar datos remotos al iniciar o cambiar fleetId
  const pullData = useCallback(async (token: string, fid: string) => {
    if (!token || !fid) return;
    setIsLoadingRemote(true);
    setSyncStatus('syncing');
    try {
      const remote = await cloudApi.getData(token, fid);
      if (remote && remote.payload) {
        setVehicles(remote.payload.vehicles || []);
        setWorkers(remote.payload.workers || []);
        setWorks(remote.payload.works || []);
        setLogs(remote.payload.logs || []);
        setPriceHistory(remote.payload.priceHistory || []);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('idle');
      }
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsLoadingRemote(false);
    }
  }, []);

  // Monitor Auth
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
        setRole('admin');
        if (fleetId) pullData(token, fleetId);
      } else {
        const isDemo = localStorage.getItem('fleet_demo_mode') === 'true';
        if (!isDemo) setRole('none');
      }
    });
  }, [fleetId, pullData]);

  // 2. Persistencia en LocalStorage (Copia de seguridad local)
  useEffect(() => {
    localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('fleet_workers', JSON.stringify(workers));
    localStorage.setItem('fleet_works', JSON.stringify(works));
    localStorage.setItem('fleet_logs', JSON.stringify(logs));
    localStorage.setItem('fleet_prices', JSON.stringify(priceHistory));
    localStorage.setItem('fleet_id', fleetId);
  }, [vehicles, workers, works, logs, priceHistory, fleetId]);

  // 3. Auto-Sincronización PUSH (Debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!idToken || !fleetId || role !== 'admin') return;

    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);

    setSyncStatus('syncing');
    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        await cloudApi.putData(idToken, fleetId, {
          vehicles, workers, works, logs, priceHistory
        });
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } catch (e) {
        setSyncStatus('error');
      }
    }, 3000);

    return () => { if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current); };
  }, [vehicles, workers, works, logs, priceHistory, idToken, fleetId, role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === '1234') {
      localStorage.setItem('fleet_demo_mode', 'true');
      setRole('admin');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginUsername, loginPassword);
    } catch (error) {
      alert("Error de acceso: Credenciales no válidas.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem('fleet_demo_mode');
    setRole('none');
    setIdToken('');
  };

  const alerts: Alert[] = useMemo(() => {
    const arr: Alert[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    vehicles.forEach(v => {
      if (v.itvDate && v.itvDate < todayStr) arr.push({ id: `itv-${v.id}`, type: 'danger', plate: v.plate, reason: 'ITV Caducada' });
      if (v.insuranceExpiry && v.insuranceExpiry < todayStr) arr.push({ id: `ins-${v.id}`, type: 'danger', plate: v.plate, reason: 'Seguro Caducado' });
      if (v.maintStatus === 'Atrasado') arr.push({ id: `maint-${v.id}`, type: 'danger', plate: v.plate, reason: 'Mantenimiento Atrasado' });
    });
    return arr;
  }, [vehicles]);

  if (role === 'none') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-50 p-6">
        <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-2xl mb-4"><Truck className="w-10 h-10 text-white" /></div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent text-center">FleetMaster AI</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Nube y Gestión en Tiempo Real</p>
          </div>
          <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-center flex items-center justify-center gap-2"><Lock className="w-5 h-5 text-blue-500" /> Acceso Seguro</h2>
            <div className="space-y-4">
              <input required type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Email o 'admin'" />
              <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Contraseña o '1234'" />
              <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">Iniciar Sesión</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {isLoadingRemote && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="relative">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
            <Cloud className="w-8 h-8 text-white absolute inset-0 m-auto" />
          </div>
          <h2 className="text-2xl font-black mt-6 tracking-tight">Sincronizando Flota...</h2>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Descargando registros desde Firestore</p>
        </div>
      )}

      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><Truck className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FleetMaster AI</h1>
              <div className="flex items-center gap-2">
                 <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${syncStatus === 'synced' ? 'text-green-400' : syncStatus === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                   {syncStatus === 'syncing' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                   {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'error' ? 'Error Sync' : `Cloud: ${fleetId || 'No vinculado'}`}
                 </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"><LogOut className="w-5 h-5" /></button>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-4 flex overflow-x-auto no-scrollbar">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === item.id ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
              {activeTab === item.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        {activeTab === 'dashboard' && <Dashboard vehicles={vehicles} workers={workers} works={works} logs={logs} alerts={alerts} priceHistory={priceHistory} />}
        {activeTab === 'vehicles' && <Vehicles vehicles={vehicles} setVehicles={setVehicles} isAdmin={role === 'admin'} />}
        {activeTab === 'workers' && <Workers workers={workers} setWorkers={setWorkers} isAdmin={role === 'admin'} />}
        {activeTab === 'works' && <Works works={works} setWorks={setWorks} isAdmin={role === 'admin'} />}
        {activeTab === 'logs' && <Logs logs={logs} setLogs={setLogs} vehicles={vehicles} setVehicles={setVehicles} workers={workers} works={works} isAdmin={role === 'admin'} currentUser={null} />}
        {activeTab === 'stats' && <Stats logs={logs} vehicles={vehicles} workers={workers} works={works} priceHistory={priceHistory} />}
        {activeTab === 'maintenance' && <Maintenance vehicles={vehicles} setVehicles={setVehicles} isAdmin={role === 'admin'} alerts={alerts} />}
        {activeTab === 'settings' && (
          <Settings 
            priceHistory={priceHistory} 
            setPriceHistory={setPriceHistory} 
            isAdmin={role === 'admin'} 
            syncId={fleetId} 
            setSyncId={(id) => {
              setFleetId(id);
              if (idToken) pullData(idToken, id);
            }} 
            onImportJSON={(data) => {
              setVehicles(data.vehicles || []);
              setWorkers(data.workers || []);
              setWorks(data.works || []);
              setLogs(data.logs || []);
              setPriceHistory(data.priceHistory || []);
            }}
            fullState={{ vehicles, workers, works, logs, priceHistory }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
