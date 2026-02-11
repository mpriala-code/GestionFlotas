
import React, { useState, useMemo, useEffect } from 'react';
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
  ShieldCheck
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

export interface Alert {
  id: string;
  plate: string;
  model: string;
  reason: string;
  type: 'warning' | 'danger';
}

// Helper to load from localStorage
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Auth states (Persisted)
  const [role, setRole] = useState<AuthRole>(() => getStorageItem('fleet_role', 'none'));
  const [currentUser, setCurrentUser] = useState<Worker | null>(() => getStorageItem('fleet_current_user', null));
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginType, setLoginType] = useState<AuthRole>('worker');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // App Config (Persisted)
  const [priceHistory, setPriceHistory] = useState<PriceRecord[]>(() => 
    getStorageItem('fleet_price_history', [
      { id: 'p_now', date: new Date().toISOString().split('T')[0], fuelPrice: 1.70, costPerKm: 0.15 },
      { id: 'p1', date: '2024-01-01', fuelPrice: 1.55, costPerKm: 0.12 }
    ])
  );
  
  // App Data (Persisted)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStorageItem('fleet_vehicles', INITIAL_VEHICLES));
  const [workers, setWorkers] = useState<Worker[]>(() => getStorageItem('fleet_workers', INITIAL_WORKERS));
  const [works, setWorks] = useState<Work[]>(() => getStorageItem('fleet_works', INITIAL_WORKS));
  const [logs, setLogs] = useState<LogEntry[]>(() => getStorageItem('fleet_logs', INITIAL_LOGS));

  const isAdmin = role === 'admin';

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('fleet_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('fleet_works', JSON.stringify(works));
  }, [works]);

  useEffect(() => {
    localStorage.setItem('fleet_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('fleet_price_history', JSON.stringify(priceHistory));
  }, [priceHistory]);

  useEffect(() => {
    localStorage.setItem('fleet_role', JSON.stringify(role));
    localStorage.setItem('fleet_current_user', JSON.stringify(currentUser));
  }, [role, currentUser]);

  // Restrict tab access based on role
  useEffect(() => {
    if (role === 'worker') {
      if (activeTab !== 'logs') setActiveTab('logs');
    } else if (role === 'none' && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  // Enhanced Alerts logic
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
        { dateStr: v.taxDate, label: 'Impuesto Circulación' },
        { dateStr: v.nextGeneralPayment, label: 'Pago General' },
      ];

      checkDates.forEach(d => {
        if (d.dateStr) {
          const alertDate = new Date(d.dateStr);
          alertDate.setHours(0, 0, 0, 0);
          if (!isNaN(alertDate.getTime())) {
            if (alertDate < today) {
              results.push({ id: `${v.id}-${d.label}-expired`, plate: v.plate, model: v.model, reason: `${d.label} caducado (${d.dateStr})`, type: 'danger' });
            } else if (alertDate <= threshold) {
              results.push({ id: `${v.id}-${d.label}-warning`, plate: v.plate, model: v.model, reason: `${d.label} próximo (${d.dateStr})`, type: 'warning' });
            }
          }
        }
      });
      if (v.maintStatus === MaintenanceStatus.DELAYED) {
        results.push({ id: `${v.id}-maint-delayed`, plate: v.plate, model: v.model, reason: 'Mantenimiento ATRASADO', type: 'danger' });
      }
    });
    return results;
  }, [vehicles]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === 'admin') {
      if (loginUsername === 'admin' && loginPassword === 'admin123') {
        setRole('admin');
        setCurrentUser(null);
        setShowLoginModal(false);
        resetLoginFields();
      } else {
        alert('Credenciales de administrador incorrectas');
      }
    } else {
      const found = workers.find(w => w.username === loginUsername && w.password === loginPassword);
      if (found) {
        setRole('worker');
        setCurrentUser(found);
        setShowLoginModal(false);
        resetLoginFields();
      } else {
        alert('Usuario o contraseña de trabajador incorrectos');
      }
    }
  };

  const resetLoginFields = () => {
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      setRole('none');
      setCurrentUser(null);
      setActiveTab('dashboard');
    }
  };

  // Define navigation items based on role
  const navItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
      { id: 'vehicles', label: 'Vehículos', icon: Truck },
      { id: 'workers', label: 'Trabajadores', icon: Users },
      { id: 'works', label: 'Obras', icon: HardHat },
      { id: 'logs', label: 'Registros', icon: ClipboardList },
      { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
      { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
      { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
    ];

    if (role === 'worker') {
      return allItems.filter(item => item.id === 'logs');
    }

    if (role === 'none') {
      return allItems.filter(item => item.id === 'dashboard');
    }

    return allItems;
  }, [role]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard vehicles={vehicles} workers={workers} works={works} logs={logs} alerts={alerts} priceHistory={priceHistory} />;
      case 'vehicles': return <Vehicles vehicles={vehicles} setVehicles={setVehicles} isAdmin={isAdmin} />;
      case 'workers': return <Workers workers={workers} setWorkers={setWorkers} isAdmin={isAdmin} />;
      case 'works': return <Works works={works} setWorks={setWorks} isAdmin={isAdmin} />;
      case 'logs': return <Logs logs={logs} setLogs={setLogs} vehicles={vehicles} setVehicles={setVehicles} workers={workers} works={works} isAdmin={isAdmin} currentUser={currentUser} />;
      case 'stats': return <Stats logs={logs} vehicles={vehicles} workers={workers} works={works} priceHistory={priceHistory} />;
      case 'maintenance': return <Maintenance vehicles={vehicles} setVehicles={setVehicles} isAdmin={isAdmin} alerts={alerts} />;
      case 'settings': return <Settings priceHistory={priceHistory} setPriceHistory={setPriceHistory} isAdmin={isAdmin} />;
      default: return <Dashboard vehicles={vehicles} workers={workers} works={works} logs={logs} alerts={alerts} priceHistory={priceHistory} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              FleetMaster AI
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && alerts.length > 0 && (
              <div className="relative group cursor-pointer">
                <Bell className={`w-6 h-6 ${alerts.some(a => a.type === 'danger') ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
                <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white">
                  {alerts.length}
                </span>
                <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 max-h-[400px] overflow-y-auto">
                  <p className="text-sm font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Notificaciones Activas:
                  </p>
                  <ul className="space-y-3">
                    {alerts.map(a => (
                      <li key={a.id} className={`text-[11px] p-2 rounded-lg border flex flex-col gap-1 ${
                        a.type === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200'
                      }`}>
                        <span className="font-bold flex items-center justify-between">
                          <span>{a.plate}</span>
                          <span className={`text-[9px] uppercase px-1 rounded ${a.type === 'danger' ? 'bg-red-500/30' : 'bg-yellow-500/30'}`}>
                            {a.type === 'danger' ? 'Crítico' : 'Aviso'}
                          </span>
                        </span>
                        <span>{a.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {role === 'none' ? (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-blue-600/20"
              >
                <LogIn className="w-4 h-4" />
                Acceder
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-200">{role === 'admin' ? 'Administrador' : currentUser?.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">{role === 'admin' ? 'Control Total' : 'Perfil Trabajador'}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 border-t border-slate-800 overflow-x-auto">
          <nav className="flex items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative min-w-max ${
                    activeTab === item.id 
                      ? 'text-blue-400' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {renderContent()}
      </main>

      <footer className="py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} FleetMaster AI - Gestión Integral de Flotas - Datos persistidos localmente
      </footer>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-center">Identificación de Usuario</h2>
            
            <div className="flex bg-slate-800 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setLoginType('worker')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${loginType === 'worker' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <UserCircle className="w-4 h-4" />
                Trabajador
              </button>
              <button 
                onClick={() => setLoginType('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${loginType === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ShieldCheck className="w-4 h-4" />
                Administrador
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuario</label>
                <input 
                  required
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder={loginType === 'admin' ? "admin" : "usuario_trabajador"}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                <input 
                  required
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => { setShowLoginModal(false); resetLoginFields(); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl transition-colors font-bold shadow-lg shadow-blue-600/30"
                >
                  Entrar
                </button>
              </div>
            </form>
            <p className="mt-6 text-[10px] text-center text-slate-500 italic">
              * Administrador: <b>admin / admin123</b><br/>
              * Trabajadores por defecto: <b>antonio / 123</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
