import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CompanyProfile, AdminProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'visitor';
  onLogout: () => void;
  onRefreshData?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  userRole, 
  onLogout, 
  onRefreshData 
}) => {
  const isAdmin = userRole === 'admin';
  const [config, setConfig] = useState<{company: CompanyProfile, admin: AdminProfile}>({
    company: StorageService.getCompanyProfile(),
    admin: StorageService.getAdminProfile()
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(StorageService.getLastSyncTime());
  const [globalSearch, setGlobalSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    StorageService.getAppSettings().then(cfg => {
      if (cfg) setConfig(cfg);
    });
    
    const interval = setInterval(() => {
      setLastSync(StorageService.getLastSyncTime());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await StorageService.syncWithSheets();
    if (success) {
      setLastSync(StorageService.getLastSyncTime());
      if (onRefreshData) onRefreshData();
    }
    setIsSyncing(false);
  };
  
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', shortLabel: 'Home', adminOnly: false },
    { id: 'employees', label: 'Colaboradores', icon: '👥', shortLabel: 'Equipe', adminOnly: true },
    { id: 'visitor_search', label: 'Consulta Rápida', icon: '🔍', shortLabel: 'Busca', adminOnly: false, visitorOnly: true },
    { id: 'reports', label: 'Relatórios & Auditoria', icon: '📋', shortLabel: 'Auditoria', adminOnly: false },
    { id: 'matrix', label: 'Matriz de Cursos', icon: '📜', shortLabel: 'Normas NR', adminOnly: false },
    { id: 'config', label: 'Configurações', icon: '⚙️', shortLabel: 'Ajustes', adminOnly: true },
  ];

  const visibleTabs = allTabs.filter(tab => {
    if (tab.adminOnly && !isAdmin) return false;
    if (tab.visitorOnly && isAdmin) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#181436] text-[#181236] font-['Plus_Jakarta_Sans',sans-serif] p-2 md:p-5 lg:p-6 antialiased flex flex-col justify-center">
      {/* Container Principal Estilo Card Flutuante Dark da Referência */}
      <div className="w-full max-w-[1720px] mx-auto min-h-[96vh] rounded-[2.5rem] bg-gradient-to-br from-[#1e1944] via-[#231d50] to-[#292258] border border-[#372d77]/60 shadow-[0_30px_90px_rgba(10,8,30,0.65)] flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Barra Superior Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#211B4F] text-white no-print sticky top-0 z-[110] border-b border-[#362D78]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center p-1.5 shadow-md">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <circle cx="20" cy="20" r="18" fill="#181436" />
                <path d="M12 20 C12 14, 20 10, 26 14 C22 15, 17 18, 16 24 Z" fill="#00D26A" />
                <path d="M28 20 C28 26, 20 30, 14 26 C18 25, 23 22, 24 16 Z" fill="#6342E8" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight leading-none block">ControlSST</span>
              <span className="text-[9px] text-[#A59FD3] uppercase tracking-widest font-semibold">Gestão Normativa</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 bg-[#31276C] text-white rounded-xl active:scale-95 transition-transform border border-[#44388A]"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Estilo Cápsula Dark da Referência */}
        <nav className={`
          fixed inset-y-0 left-0 z-[105] w-72 md:relative md:w-[260px] lg:w-[280px] bg-[#211B4F] text-white flex flex-col no-print transition-all duration-300 border-r border-[#342A76]/70 md:rounded-l-[2.5rem]
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Logo / Brand Header */}
          <div className="p-7 pb-6 flex flex-col items-center text-center border-b border-[#322872]/60">
            <div className="relative mb-3 group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 shadow-xl shadow-purple-950/40 transform group-hover:scale-105 transition-transform duration-300">
                {/* Ícone Estilizado de Órbita Verde/Violeta como na referência */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="orbitGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E676" />
                      <stop offset="100%" stopColor="#00B0FF" />
                    </linearGradient>
                    <linearGradient id="orbitViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C4DFF" />
                      <stop offset="100%" stopColor="#536DFE" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="46" fill="#191538" />
                  {/* Curva Superior Verde */}
                  <path d="M 28 50 C 28 32, 45 22, 68 28 C 55 33, 40 42, 38 58 Z" fill="url(#orbitGreen)" />
                  {/* Curva Inferior Violeta */}
                  <path d="M 72 50 C 72 68, 55 78, 32 72 C 45 67, 60 58, 62 42 Z" fill="url(#orbitViolet)" />
                  <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              <span>Control</span>
              <span className="text-[#00D26A]">SST</span>
            </h1>
            <p className="text-[10px] text-[#9E98D0] font-semibold tracking-wider mt-0.5 uppercase">
              Auditoria & Treinamentos
            </p>
          </div>

          {/* Lista de Navegação */}
          <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all duration-200 relative group ${
                    isActive 
                      ? 'bg-[#553AC8] text-white shadow-lg shadow-purple-950/40 font-bold' 
                      : 'text-[#9E98D0] hover:text-white hover:bg-[#2C2465]/70 font-medium'
                  }`}
                >
                  {/* Indicador sutil na aba ativa */}
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#00D26A] rounded-full shadow-[0_0_10px_#00D26A]" />
                  )}
                  <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-90'}`}>
                    {tab.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs tracking-wide font-semibold">
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}

            {isAdmin && (
              <div className="pt-6 mt-2 border-t border-[#342A76]/50 space-y-2">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all border border-[#3E328A] bg-[#271F5E]/60 text-[#B3ADDF] hover:text-white hover:bg-[#553AC8]/40 hover:border-[#553AC8] ${isSyncing ? 'animate-pulse' : ''}`}
                >
                  <span className={`text-base ${isSyncing ? 'animate-spin text-[#00D26A]' : ''}`}>🔄</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-4 border-t border-[#322872]/60 space-y-3 bg-[#1C1645]/70 md:rounded-bl-[2.5rem]">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D26A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D26A]"></span>
                </span>
                <span className="text-[10px] text-[#A59FD3] font-semibold">Cloud Conectado</span>
              </div>
              <span className="text-[9px] text-[#867FB7] font-mono">v2.6</span>
            </div>

            <button 
              onClick={onLogout} 
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2"
            >
              <span>Desconectar Sessão</span>
              <span>🚪</span>
            </button>
          </div>
        </nav>

        {/* Área Principal de Conteúdo */}
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-full">
          {/* Top Header Barra da Referência */}
          <div className="no-print px-6 md:px-10 pt-7 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Boas-vindas / Título Principal */}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{isAdmin ? 'Olá, Gestor SST!' : 'Portal de Consulta SST'}</span>
                <span className="inline-block animate-pulse">✨</span>
              </h2>
              <p className="text-xs md:text-sm text-[#A59FD3] font-medium mt-0.5">
                Painel Geral de Conformidade, Validades e Auditoria Normativa
              </p>
            </div>

            {/* Ações do Topo: Busca + Notificação + Perfil */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Barra de Pesquisa Estilo Cápsula da Referência */}
              <div className="relative flex-1 md:w-64 lg:w-72">
                <input 
                  type="text" 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Pesquise por algo..." 
                  className="w-full bg-[#2C2465] text-white text-xs placeholder-[#8E88B8] pl-9 pr-4 py-2.5 rounded-2xl border border-[#3E3486] focus:border-[#5E3BEE] focus:outline-none focus:ring-2 focus:ring-[#5E3BEE]/30 transition-all shadow-inner"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#938DBF]">
                  🔍
                </span>
              </div>

              {/* Botão de Notificação com Ponto Neon Verde */}
              <button 
                title="Status do Sistema"
                className="w-10 h-10 rounded-2xl bg-[#2C2465] border border-[#3E3486] flex items-center justify-center text-sm relative hover:bg-[#392F80] transition-colors"
              >
                <span>🔔</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00D26A] shadow-[0_0_8px_#00D26A]"></span>
              </button>

              {/* Avatar do Usuário */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 bg-[#2C2465] hover:bg-[#392F80] border border-[#3E3486] rounded-2xl transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5E3BEE] to-[#00D26A] flex items-center justify-center text-white font-black text-xs shadow-md">
                    {isAdmin ? 'AD' : 'VI'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-white leading-tight">
                      {isAdmin ? 'Administrador' : 'Visitante'}
                    </p>
                    <p className="text-[9px] text-[#A59FD3] font-medium leading-none">
                      {lastSync ? `Sinc: ${lastSync}` : 'Cloud Ativo'}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#A59FD3]">▾</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#211B4F] rounded-2xl border border-[#3C3284] shadow-2xl p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-[#352B75]/60">
                      <p className="text-xs font-bold text-white">{isAdmin ? 'Administrador SST' : 'Usuário Consulta'}</p>
                      <p className="text-[10px] text-[#9E98D0]">brunosilva1232014@gmail.com</p>
                    </div>
                    <button 
                      onClick={() => { setActiveTab('config'); setShowUserMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-[#B3ADDF] hover:text-white hover:bg-[#332A75] rounded-xl mt-1 transition-colors flex items-center gap-2"
                    >
                      <span>⚙️</span> Configurações
                    </button>
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span> Encerrar Sessão
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conteúdo da Visão Ativa */}
          <div className="flex-1 p-4 md:p-8 lg:p-10 pt-2 w-full max-w-full overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
