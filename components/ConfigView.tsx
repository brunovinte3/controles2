import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { AdminProfile } from '../types';

const ConfigView: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [url, setUrl] = useState(StorageService.getSheetsUrl());
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(StorageService.getLastSyncTime());
  
  const initialAdmin = StorageService.getAdminProfile();
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(initialAdmin);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  useEffect(() => {
    setUrl(StorageService.getSheetsUrl());
    setLastSync(StorageService.getLastSyncTime());
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.updateAdminProfile(adminProfile);
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 3000);
  };

  const validateAndTest = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://script.google.com')) {
      setStatus('error');
      setErrorMessage('URL inválida. Deve começar com https://script.google.com');
      return;
    }

    setStatus('testing');
    setErrorMessage('');
    
    try {
      StorageService.saveSheetsUrl(cleanUrl);
      const success = await StorageService.syncWithSheets();
      if (success) {
        setStatus('success');
        setLastSync(StorageService.getLastSyncTime());
        onUpdate();
      } else {
        setStatus('error');
        setErrorMessage('O Google respondeu mas o formato dos dados é incompatível.');
      }
    } catch (err: any) {
      console.error("Erro detectado:", err);
      setStatus('error');
      setErrorMessage(err.message || 'Erro de conexão.');
    }
  };

  const sqlFix = `-- COMANDO DE REPARO E ATUALIZAÇÃO DE SCHEMA NO SUPABASE:
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration TEXT NOT NULL,
  role TEXT DEFAULT '-',
  setor TEXT DEFAULT 'Geral',
  company TEXT DEFAULT 'Empresa Padrão',
  "photoUrl" TEXT,
  trainings JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS setor TEXT DEFAULT 'Geral';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '-';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company TEXT DEFAULT 'Empresa Padrão';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS trainings JSONB DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';`;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn space-y-8 pb-20">
      {/* Header */}
      <div className="bg-[#251F56]/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-[#3A307E]/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Configurações & Integração Cloud</span>
            <span className="text-xs bg-[#5439C7] text-white px-2.5 py-0.5 rounded-full font-bold">Base de Dados</span>
          </h2>
          <p className="text-xs text-[#A59FD3] font-medium mt-0.5">
            Sincronização com Google Sheets, Supabase e credenciais administrativas
          </p>
        </div>
        <span className="text-[10px] text-[#A59FD3] font-mono">
          {lastSync ? `Última sincronização: ${lastSync}` : 'Aguardando Sincronização'}
        </span>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] border border-[#ECEAF6] space-y-8">
        {/* Alerta de Erro de Schema */}
        {status === 'error' && (errorMessage.includes('column') || errorMessage.includes('cache') || errorMessage.includes('schema')) && (
          <div className="bg-[#1F1745] text-white p-6 rounded-2xl space-y-3 border-l-4 border-amber-500 animate-fadeIn">
             <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
               <span>🚨</span> Atualização de Schema Necessária no Supabase
             </h4>
             <p className="text-xs text-[#C5BFEA]">
               O Supabase requer recarregamento do schema para as novas colunas de cursos. Copie e execute o comando abaixo no SQL Editor do Supabase:
             </p>
             <div className="relative">
               <pre className="bg-[#120E2C] p-4 rounded-xl text-[10px] font-mono overflow-x-auto text-[#00E676] border border-[#34296E]">
                 {sqlFix}
               </pre>
               <button 
                onClick={() => navigator.clipboard.writeText(sqlFix)}
                className="absolute top-3 right-3 bg-[#5439C7] hover:bg-[#432CA5] text-white text-[9px] px-3 py-1 rounded-lg font-bold transition-colors"
               >
                 Copiar SQL
               </button>
             </div>
          </div>
        )}

        {/* Integração Google Sheets */}
        <div className="bg-[#F8F7FD] p-6 rounded-2xl border border-[#ECEAF6] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#181236] uppercase tracking-wider flex items-center gap-2">
              <span>📊</span> URL da Planilha Google (App Script API)
            </span>
            <span className="text-[10px] font-bold text-[#00A850] bg-[#E6FAF0] px-2.5 py-0.5 rounded-full">
              Sincronização Bidirecional
            </span>
          </div>

          <div className="space-y-3">
            <input 
              type="text" 
              className="w-full bg-white border border-[#DDD7F4] focus:border-[#5439C7] rounded-xl p-3.5 text-xs font-mono text-[#181236] outline-none shadow-sm transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            
            <button 
              onClick={validateAndTest}
              disabled={status === 'testing'}
              className="w-full py-3.5 bg-[#5439C7] hover:bg-[#442DA8] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{status === 'testing' ? '⌛ Sincronizando com Google Sheets...' : 'Sincronizar e Atualizar Agora'}</span>
              <span>🔄</span>
            </button>

            {status === 'success' && (
              <div className="bg-[#E6FAF0] text-[#00A850] p-3 rounded-xl text-center font-bold text-xs border border-[#BDEECF] animate-fadeIn">
                ✅ Sincronizado com Sucesso com a Planilha!
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-center font-bold text-xs border border-red-200 leading-relaxed animate-fadeIn">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Perfil Administrativo */}
        <div className="border-t border-[#ECEAF6] pt-6 space-y-4">
          <span className="text-xs font-black text-[#181236] uppercase tracking-wider flex items-center gap-2">
            <span>🔐</span> Credenciais do Administrador
          </span>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7A72A3] uppercase tracking-wider ml-1">Usuário</label>
              <input 
                type="text" 
                className="w-full bg-[#F8F7FD] border border-[#DDD7F4] rounded-xl p-3 text-xs font-bold text-[#181236] outline-none focus:bg-white focus:border-[#5439C7]"
                value={adminProfile.username}
                onChange={(e) => setAdminProfile({...adminProfile, username: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#7A72A3] uppercase tracking-wider ml-1">Senha</label>
              <input 
                type="password" 
                className="w-full bg-[#F8F7FD] border border-[#DDD7F4] rounded-xl p-3 text-xs font-bold text-[#181236] outline-none focus:bg-white focus:border-[#5439C7]"
                value={adminProfile.password}
                onChange={(e) => setAdminProfile({...adminProfile, password: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-[#241E54] hover:bg-[#342B76] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
              >
                {isProfileSaved ? 'Salvo! ✅' : 'Salvar Credenciais'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ConfigView;
