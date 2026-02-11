
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Truck, Users, HardHat, ClipboardList, BarChart3, Wrench, LogIn, LogOut,
  Wifi, WifiOff, Lock, RefreshCw, Cloud, ShieldCheck, Settings as SettingsIcon, User as UserIcon,
  Zap, PlayCircle
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

// Configuración Firebase (Opcional para modo local)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "ID",
  appId: "APP_ID"
};

// Inicialización segura de Firebase
let auth: any = null;
try {
  if (firebaseConfig.apiKey !== "TU_API_KEY") {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (e) {
  console.warn("Firebase no configurado correctamente.");
}

const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try { return JSON.parse(saved); } catch (e) { return defaultValue; }
};

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
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string>('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados de datos
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStorageItem('fleet_vehicles', INITIAL_VEHICLES));
  const [workers, setWorkers] = useState<Worker[]>(() => getStorageItem('fleet_workers', INITIAL_WORKERS));
  const [works, setWorks] = useState<Work[]>(() => getStorageItem('fleet_works', INITIAL_WORKS));
  const [logs, setLogs] = useState<LogEntry[]>(() => getStorageItem('fleet_logs', INITIAL_LOGS));
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>(() => getStorageItem('fleet_prices', [{ id: 'p_now', date: new Date().toISOString().split('T')[0], fuelPrice: 1.70, costPerKm: 0.15 }]));

  const lastUpdateRef = useRef<number>(Date.now());

  // 1. Monitor de Auth de Firebase
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setFbUser(user as User);
        setIdToken(token);
        setRole('admin');
      }
    });
  }, []);

  // 2. Persistencia en LocalStorage
  useEffect(() => {
    localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('fleet_workers', JSON.stringify(workers));
    localStorage.setItem('fleet_works', JSON.stringify(works));
    localStorage.setItem('fleet_logs', JSON.stringify(logs));
    localStorage.setItem('fleet_prices', JSON.stringify(priceHistory));
    localStorage.setItem('fleet_role', JSON.stringify(role));
  }, [vehicles, workers, works, logs, priceHistory, role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ACCESO MAESTRO ADMIN / 1234
    if (loginUsername === 'admin' && loginPassword === '1234') {
      localStorage.setItem('fleet_demo_mode', 'true');
      setRole('admin');
      return;
    }

    if (!auth) {
      alert("Para usar este usuario, configura Firebase. O usa 'admin' / '1234'");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginUsername, loginPassword);
    } catch (error: any) {
      alert("Error: Credenciales incorrectas");
    }
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      if (auth) signOut(auth);
      localStorage.removeItem('fleet_demo_mode');
      localStorage.removeItem('fleet_role');
      setRole('none');
      setFbUser(null);
      setIdToken('');
    }
  };

  const pullFromCloud = useCallback(async (token: string) => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const remote = await cloudApi.getData(token);
      if (remote && remote.payload) {
        setVehicles(remote.payload.vehicles);
        setLogs(remote.payload.logs);
        setWorkers(remote.payload.workers);
        setWorks(remote.payload.works);
        setPriceHistory(remote.payload.priceHistory);
        setLastSyncTime(new Date());
      }
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

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
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">FleetMaster AI</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Gestión Profesional de Flotas</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
            <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-3">
              <Lock className="w-5 h-5 text-blue-500" /> Acceso al Sistema
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Usuario / Email</label>
                <input required type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="admin" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Contraseña</label>
                <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="••••" />
              </div>
              <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                Entrar ahora
              </button>
            </form>
            
            <p className="text-[10px] text-center text-slate-500 italic px-4">
              Pista: Credenciales maestras habilitadas para este dispositivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><Truck className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FleetMaster AI</h1>
              <div className="flex items-center gap-2">
                 {idToken ? (
                   <span className="flex items-center gap-1 text-[9px] text-green-400 font-bold uppercase tracking-widest">
                     <ShieldCheck className="w-3 h-3" /> Sincronización Cloud
                   </span>
                 ) : (
                   <span className="flex items-center gap-1 text-[9px] text-yellow-500 font-bold uppercase tracking-widest">
                     <WifiOff className="w-3 h-3" /> Modo Local
                   </span>
                 )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
            syncId={idToken ? "Conectado" : "Local"} 
            setSyncId={() => {}} 
            onImportJSON={(data) => {
              if (data.vehicles) setVehicles(data.vehicles);
              if (data.workers) setWorkers(data.workers);
              if (data.works) setWorks(data.works);
              if (data.logs) setLogs(data.logs);
              if (data.priceHistory) setPriceHistory(data.priceHistory);
            }}
            fullState={{ vehicles, workers, works, logs, priceHistory }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
