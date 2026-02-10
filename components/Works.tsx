
import React, { useState } from 'react';
import { Plus, HardHat, MapPin, Trash2, Edit2, CheckCircle2, Clock } from 'lucide-react';
import { Work, WorkStatus } from '../types';

interface WorksProps {
  works: Work[];
  setWorks: React.Dispatch<React.SetStateAction<Work[]>>;
  isAdmin: boolean;
}

const Works: React.FC<WorksProps> = ({ works, setWorks, isAdmin }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Work | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<WorkStatus>(WorkStatus.ACTIVE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setWorks(prev => prev.map(w => w.id === editing.id ? { ...w, name, address, status } : w));
    } else {
      setWorks(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, address, status }]);
    }
    closeModal();
  };

  const openEdit = (w: Work) => {
    setEditing(w);
    setName(w.name);
    setAddress(w.address);
    setStatus(w.status);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setName('');
    setAddress('');
    setStatus(WorkStatus.ACTIVE);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Proyectos y Obras</h2>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all">
            <Plus className="w-5 h-5" />
            Nueva Obra
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map(work => (
          <div key={work.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 group hover:border-blue-500/50 transition-all">
            <div className="flex justify-between mb-4">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${work.status === WorkStatus.ACTIVE ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {work.status === WorkStatus.ACTIVE ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {work.status}
              </div>
              {isAdmin && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(work)} className="p-1 hover:bg-slate-800 rounded text-blue-400"><Edit2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <h4 className="font-bold text-lg mb-2">{work.name}</h4>
            <p className="text-slate-400 text-sm flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-blue-400" />
              {work.address}
            </p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{editing ? 'Editar Obra' : 'Nueva Obra'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre de la Obra</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Dirección</label>
                <input required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Estado</label>
                <select value={status} onChange={e => setStatus(e.target.value as WorkStatus)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                  <option value={WorkStatus.ACTIVE}>Activa</option>
                  <option value={WorkStatus.COMPLETED}>Completada</option>
                </select>
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

export default Works;
