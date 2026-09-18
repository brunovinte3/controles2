import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { UserRole, CompanyProfile, AdminProfile } from '../types';

interface AuthViewProps {
  onLogin: (role: UserRole) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [appConfig, setAppConfig] = useState<{company: CompanyProfile, admin: AdminProfile}>({
    company: StorageService.getCompanyProfile(),
    admin: StorageService.getAdminProfile()
  });

  useEffect(() => {
    StorageService.getAppSettings().then(config => {
      if (config) setAppConfig(config);
    });
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appConfig) return;
    
    if (username === appConfig.admin.username && password === appConfig.admin.password) {
      onLogin('admin');
    } else {
      setError('Credenciais incorretas. Verifique usuário e senha.');
      setTimeout(() => setError(''), 3500);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(`Um link de recuperação foi enviado para brunosilva1232014@gmail.com`);
    setTimeout(() => {
      setSuccess('');
      setMode('login');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#181436] flex items-center justify-center p-4 md:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Luz ambiente de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#553AC8]/25 to-[#00D26A]/15 rounded-full blur-3xl opacity-60 animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_30px_90px_rgba(10,8,30,0.5)] overflow-hidden border border-[#EBE7F7] animate-fadeIn relative z-10">
        
        <div className="p-8 md:p-10">
          <header className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4 group">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-2.5 shadow-xl shadow-purple-950/20 border border-[#E9E5F7]">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="authOrbitGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E676" />
                      <stop offset="100%" stopColor="#00B0FF" />
                    </linearGradient>
                    <linearGradient id="authOrbitViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C4DFF" />
                      <stop offset="100%" stopColor="#536DFE" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="46" fill="#181436" />
                  <path d="M 28 50 C 28 32, 45 22, 68 28 C 55 33, 40 42, 38 58 Z" fill="url(#authOrbitGreen)" />
                  <path d="M 72 50 C 72 68, 55 78, 32 72 C 45 67, 60 58, 62 42 Z" fill="url(#authOrbitViolet)" />
                  <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#181236]">
              <span>Control</span>
              <span className="text-[#00D26A]">SST</span>
            </h1>
            <p className="text-[11px] text-[#8C85B5] font-bold uppercase tracking-widest mt-1">
              Painel de Gestão e Auditoria Normativa
            </p>
          </header>

          {mode === 'login' ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#7B73A4] uppercase tracking-wider ml-1">
                  Usuário Gestor
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-[#F4F3FB] border border-[#E3DEF5] focus:border-[#5439C7] rounded-2xl p-3.5 pl-10 font-bold text-xs text-[#181236] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#5439C7]/20"
                    placeholder="Nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8D86B6]">👤</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#7B73A4] uppercase tracking-wider ml-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    className="w-full bg-[#F4F3FB] border border-[#E3DEF5] focus:border-[#5439C7] rounded-2xl p-3.5 pl-10 font-bold text-xs text-[#181236] outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[#5439C7]/20"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8D86B6]">🔒</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center animate-shake">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-[#5439C7] hover:bg-[#442DA8] text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-950/25 active:scale-95 transition-all mt-2 flex items-center justify-center gap-2"
              >
                <span>Acessar Painel</span>
                <span>⚡</span>
              </button>

              <div className="flex flex-col gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] font-bold text-[#867FB1] hover:text-[#5439C7] transition-colors text-center"
                >
                  Esqueci minha senha
                </button>
                <div className="relative py-1">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#EAE6F7]"></div></div>
                   <div className="relative flex justify-center text-[9px] uppercase font-bold text-[#9892C2]"><span className="bg-white px-3">ou</span></div>
                </div>
                <button 
                  type="button"
                  onClick={() => onLogin('visitor')}
                  className="w-full py-3.5 bg-[#F4F3FB] hover:bg-[#EAE7F8] text-[#5439C7] border border-[#DDD8F3] rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Consulta Rápida de Colaborador</span>
                  <span>👁️</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4 animate-fadeIn">
              <div className="text-center mb-4">
                <h3 className="text-lg font-black text-[#181236] tracking-tight">Recuperar Acesso</h3>
                <p className="text-xs text-[#867FB1]">As instruções serão enviadas para o e-mail cadastrado.</p>
              </div>
              {success ? (
                <div className="bg-[#E6FAF0] p-5 rounded-2xl border border-[#BCEFCE] text-center">
                   <p className="text-[#00A850] font-black text-xs">{success}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#7B73A4] uppercase tracking-wider ml-1">E-mail Administrativo</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-[#F4F3FB] border border-[#E3DEF5] rounded-2xl p-3.5 font-bold text-xs text-[#181236] outline-none focus:bg-white focus:border-[#5439C7]"
                      placeholder="brunosilva1232014@gmail.com"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-[#5439C7] text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/20"
                  >
                    Enviar Link de Resgate
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full py-2 text-xs font-bold text-[#867FB1] hover:text-[#5439C7] transition-colors"
                  >
                    Voltar para o Login
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
