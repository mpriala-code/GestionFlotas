
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Truck, Users, HardHat, ClipboardList, BarChart3, Wrench, LogIn, LogOut,
  Wifi, WifiOff, Lock, RefreshCw, Cloud, ShieldCheck, Settings as SettingsIcon, User as UserIcon,
  Zap, PlayCircle, CheckCircle2, AlertCircle, PlusCircle, Users2
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [role, setRole] = useState<AuthRole>(() => getStorageItem('fleet_role', 'none'));
  const [idToken, setIdToken] = useState<string>('');
  const [fleetId, setFleetId] = useState<string>(() => getStorageItem('fleet_id', ''));
  const [newFleetName, setNewFleetName] = useState('');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados de datos
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStorageItem('fleet_vehicles', INITIAL_VEHICLES));
  const [workers, setWorkers] = useState<Worker[]>(() => getStorageItem('fleet_workers', INITIAL_WORKERS));
  const [works, setWorks] = useState<Work[]>(() => getStorageItem('fleet_works', INITIAL_WORKS));
  const [logs, setLogs] = useState<LogEntry[]>(() => getStorageItem('fleet_logs', INITIAL_LOGS));
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>(() => getStorageItem('fleet_prices', []));

  const syncTimeoutRef = useRef<number | null>(null);

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
      }
    } catch (e) {
      setSyncStatus('error');
      setFleetId(''); // Si falla el acceso, limpiamos la flota para forzar selección
    } finally {
      setIsLoadingRemote(false);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
        setRole('admin');
        if (fleetId) pullData(token, fleetId);
      } else {
        setRole('none');
      }
    });
  }, [fleetId, pullData]);

  useEffect(() => {
    if (!idToken || !fleetId || role !== 'admin') return;
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    setSyncStatus('syncing');
    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        await cloudApi.putData(idToken, fleetId, { vehicles, workers, works, logs, priceHistory });
        setSyncStatus('synced');
      } catch (e) { setSyncStatus('error'); }
    }, 3000);
    return () => { if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current); };
  }, [vehicles, workers, works, logs, priceHistory, idToken, fleetId, role]);

  const handleCreateFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    try {
      const res = await cloudApi.createFleet(idToken, newFleetName);
      setFleetId(res.fleetId);
      localStorage.setItem('fleet_id', res.fleetId);
    } catch (e) { alert("Error al crear flota"); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, loginUsername, loginPassword); }
    catch (e) { alert("Credenciales inválidas"); }
  };

  if (role === 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col items-center mb-4">
            <Truck className="w-12 h-12 text-blue-500 mb-2" />
            <h1 className="text-3xl font-black">FleetMaster AI</h1>
          </div>
          <input required type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-slate-800 border-none rounded-2xl p-4" placeholder="Email" />
          <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-slate-800 border-none rounded-2xl p-4" placeholder="Contraseña" />
          <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase">Entrar</button>
        </form>
      </div>
    );
  }

  if (!fleetId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-black mb-2">Bienvenido</h2>
          <p className="text-slate-500">Para empezar, únete a una flota o crea una nueva.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><PlusCircle className="text-blue-500" /> Crear Equipo</h3>
            <form onSubmit={handleCreateFleet} className="space-y-4">
              <input value={newFleetName} onChange={e => setNewFleetName(e.target.value)} className="w-full bg-slate-800 p-4 rounded-2xl" placeholder="Nombre de tu empresa/flota" />
              <button className="w-full bg-blue-600 py-4 rounded-2xl font-black">CREAR FLOTA</button>
            </form>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><Users2 className="text-green-500" /> Unirse a Equipo</h3>
            <p className="text-sm text-slate-500">Introduce el código de flota compartido por tu administrador.</p>
            <div className="flex gap-2">
              <input id="joinId" className="flex-1 bg-slate-800 p-4 rounded-2xl" placeholder="Código: mi-flota-123" />
              <button onClick={() => setFleetId((document.getElementById('joinId') as HTMLInputElement).value)} className="bg-green-600 px-6 rounded-2xl font-bold">IR</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {isLoadingRemote && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur flex flex-col items-center justify-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">Cargando datos compartidos...</p>
        </div>
      )}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 p-2 rounded-lg"><Truck className="w-5 h-5" /></div>
             <div>
               <h1 className="text-xl font-bold">FleetMaster AI</h1>
               <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Flota: {fleetId}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-blue-500 animate-pulse'}`} />
            <button onClick={() => signOut(auth)} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 flex overflow-x-auto no-scrollbar gap-2">
          {[{id:'dashboard',label:'Inicio',icon:LayoutDashboard}, {id:'vehicles',label:'Flota',icon:Truck}, {id:'logs',label:'Viajes',icon:ClipboardList}, {id:'stats',label:'Stats',icon:BarChart3}, {id:'settings',label:'Equipo',icon:SettingsIcon}].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8">
        {activeTab === 'dashboard' && <Dashboard vehicles={vehicles} workers={workers} works={works} logs={logs} alerts={[]} priceHistory={priceHistory} />}
        {activeTab === 'vehicles' && <Vehicles vehicles={vehicles} setVehicles={setVehicles} isAdmin={true} />}
        {activeTab === 'logs' && <Logs logs={logs} setLogs={setLogs} vehicles={vehicles} setVehicles={setVehicles} workers={workers} works={works} isAdmin={true} currentUser={null} />}
        {activeTab === 'stats' && <Stats logs={logs} vehicles={vehicles} workers={workers} works={works} priceHistory={priceHistory} />}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
               <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-500"><Users2 /> Gestionar Equipo</h3>
               <p className="text-slate-500 mb-6">Añade colaboradores a esta flota usando su email de registro.</p>
               <div className="flex gap-4">
                  <input id="inviteEmail" className="flex-1 bg-slate-800 p-4 rounded-2xl" placeholder="email@colaborador.com" />
                  <button onClick={async () => {
                    const email = (document.getElementById('inviteEmail') as HTMLInputElement).value;
                    await cloudApi.inviteMember(idToken, fleetId, email);
                    alert("Invitado con éxito");
                  }} className="bg-blue-600 px-8 rounded-2xl font-black">INVITAR</button>
               </div>
            </div>
            <Settings priceHistory={priceHistory} setPriceHistory={setPriceHistory} isAdmin={true} syncId={fleetId} setSyncId={setFleetId} fullState={{vehicles, workers, works, logs, priceHistory}} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
