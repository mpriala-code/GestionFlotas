
import React, { useState, useRef } from 'react';
import { Plus, User, Briefcase, Trash2, Edit2, FileDown, FileUp } from 'lucide-react';
import { Worker } from '../types';

declare const XLSX: any;

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setWorkers(prev => prev.map(w => w.id === editing.id ? { ...w, name, position, username, password } : w));
    } else {
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
    setUsername(w.username);
    setPassword(w.password);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setName('');
    setPosition('');
    setUsername('');
    setPassword('');
  };

  const deleteWorker = (id: string) => {
    if (confirm('¿Eliminar trabajador?')) {
      setWorkers(prev => prev.filter(w => w.id !== id));
    }
  };

  // EXPORT
  const handleExport = () => {
    const data = workers.map(w => ({
      'Nombre': w.name,
      'Puesto': w.position,
      'Usuario': w.username,
      'Contraseña': w.password
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trabajadores");
    XLSX.writeFile(wb, `Trabajadores_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // IMPORT
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newWorkers: Worker[] = data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: row['Nombre'] || '',
          position: row['Puesto'] || '',
          username: row['Usuario'] || '',
          password: row['Contraseña'] || '123'
        }));

        if (newWorkers.length > 0) {
          setWorkers(prev => [...prev, ...newWorkers]);
          alert(`${newWorkers.length} trabajadores importados.`);
        }
      } catch (err) {
        alert("Error al importar el archivo.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Personal</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold transition-all border border-slate-700 text-sm"
          >
            <FileDown className="w-4 h-4 text-blue-400" />
            Exportar
          </button>
          
          {isAdmin && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl font-bold transition-all border border-slate-700 text-sm"
              >
                <FileUp className="w-4 h-4 text-green-400" />
                Importar
              </button>
              <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-600/20">
                <Plus className="w-5 h-5" />
                Añadir
              </button>
            </>
          )}
        </div>
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
