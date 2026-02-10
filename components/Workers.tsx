
import React, { useState } from 'react';
import { Plus, User, Briefcase, Trash2, Edit2 } from 'lucide-react';
import { Worker } from '../types';

interface WorkersProps {
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  isAdmin: boolean;
}

const Workers: React.FC<WorkersProps> = ({ workers, setWorkers, isAdmin }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  // Added state for username and password to comply with Worker type
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setWorkers(prev => prev.map(w => w.id === editing.id ? { ...w, name, position, username, password } : w));
    } else {
      // Fix: Added missing 'username' and 'password' properties to the new worker object
      setWorkers(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        position,
        username,
        password
      }]);
    }
    closeModal();
  };

  const openEdit = (w: Worker) => {
    setEditing(w);
    setName(w.name);
    setPosition(w.position);
    // Set username and password when editing to populate the form
    setUsername(w.username);
    setPassword(w.password);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setName('');
    setPosition('');
    // Clear username and password state on modal close
    setUsername('');
    setPassword('');
  };

  const deleteWorker = (id: string) => {
    if (confirm('¿Eliminar trabajador?')) {
      setWorkers(prev => prev.filter(w => w.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personal</h2>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all">
            <Plus className="w-5 h-5" />
            Añadir Trabajador
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map(worker => (
          <div key={worker.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/10 p-3 rounded-xl">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{worker.name}</h4>
                <p className="text-slate-400 text-sm flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" /> {worker.position}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(worker)} className="p-2 hover:bg-slate-800 rounded-lg text-blue-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteWorker(worker.id)} className="p-2 hover:bg-red-900/40 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{editing ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre Completo</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Puesto / Cargo</label>
                <input required value={position} onChange={e => setPosition(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
              </div>
              {/* Added username and password fields to the form UI */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Usuario</label>
                <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workers;
