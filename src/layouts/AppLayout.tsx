import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users as UsersIcon, 
  Calendar, 
  Wallet, 
  FileText, 
  UserCircle, 
  Monitor, 
  Smartphone, 
  Bell, 
  Clock,
  ListTree
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as api from '../services/api';

export const AppLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activities, setActivities] = useState<api.ActivityLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setUser(data.session.user);
        const name = data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Usuário';
        localStorage.setItem('pagode_finance_user', name);
      }
    };
    getSession();
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const userSub = user?.email || 'Acesso Administrativo';

  const fetchActivities = async () => {
    try {
      const logs = await api.getActivities();
      setActivities(logs);
    } catch (error) {
      console.warn('Erro ao buscar atividades (tabela pode não existir):', error);
    }
  };

  const navItems = [
    { name: 'Início', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Músicos', path: '/musicos', icon: UsersIcon },
    { name: 'Eventos', path: '/eventos', icon: Calendar },
    { name: 'Financeiro', path: '/cashflow', icon: Wallet },
    { name: 'Extrato', path: '/extrato', icon: ListTree },
    { name: 'Contratos', path: '/contracts', icon: FileText },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('pagode_finance_user');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile');
    closeDrawer(); 
  };

  const toggleNotif = () => {
    if (!isNotifOpen) fetchActivities();
    setIsNotifOpen(!isNotifOpen);
  };

  const layoutClasses = viewMode === 'mobile' 
    ? "md:max-w-md md:mx-auto md:border-x md:border-zinc-800 md:shadow-2xl" 
    : "w-full";

  return (
    <div className={`flex flex-col min-h-screen bg-zinc-950 text-gray-100 font-sans relative transition-all duration-300 ${layoutClasses}`}>
      
      {/* Top App Bar */}
      <header className={`fixed top-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 h-16 z-30 flex items-center px-4 justify-between transition-all duration-300 ${viewMode === 'mobile' ? 'md:max-w-md md:mx-auto' : ''}`}>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 -ml-2 text-zinc-300 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-[#FF169B] to-purple-500">
          Pagode Finance
        </span>
        <button 
          onClick={toggleNotif}
          className="p-2 -mr-2 text-zinc-300 hover:text-[#FF169B] transition-colors relative"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF169B] rounded-full"></span>
        </button>

        {/* Notifications Dropdown */}
        {isNotifOpen && (
          <>
            <div className="fixed inset-0 z-[35]" onClick={() => setIsNotifOpen(false)} />
            <div className="absolute top-16 right-4 w-72 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl z-[40] p-4 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-black uppercase tracking-widest text-[#FF169B]">Atividades</h3>
                 <button onClick={() => setIsNotifOpen(false)} className="text-zinc-600 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar pb-2">
                {activities.length === 0 ? (
                  <p className="text-center text-[10px] text-zinc-600 font-bold uppercase py-10 tracking-widest italic">Nenhuma atividade recente</p>
                ) : (
                  activities.map((log) => (
                    <div key={log.id} className="border-b border-zinc-800/50 pb-3 last:border-0 hover:bg-zinc-800/30 transition-colors p-2 rounded-xl">
                       <p className="text-[10px] text-white leading-relaxed">
                         <span className="font-black text-[#FF169B]">{log.userName}</span> {log.action} <span className="font-bold">{log.description}</span>
                       </p>
                       <div className="flex items-center space-x-1 mt-1.5 text-zinc-600">
                         <Clock className="w-2.5 h-2.5" />
                         <span className="text-[8px] font-bold uppercase tracking-tighter">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : 'Agora'}
                         </span>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden pt-20 pb-10">
        <Outlet />
      </main>

      {/* Sidebar Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar / Drawer */}
      <div className={`fixed top-0 left-0 w-72 h-full bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF169B] to-purple-600 flex items-center justify-center shadow-lg shadow-pink-900/20">
                <UserCircle className="w-7 h-7 text-white" />
              </div>
              <button onClick={closeDrawer} className="p-2 -mr-2 text-zinc-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-white truncate">{userName}</h2>
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-0.5 truncate">{userSub}</p>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={closeDrawer}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#FF169B]/10 text-[#FF169B] font-black uppercase tracking-widest text-xs' 
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 uppercase tracking-widest text-[10px] font-bold'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 px-6 mb-2">
               <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] opacity-50">Sistema</p>
            </div>
            <ul className="space-y-1 px-3">
              <li>
                <NavLink
                  to="/usuarios"
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#FF169B]/10 text-[#FF169B] font-black uppercase tracking-widest text-[10px]' 
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-bold uppercase tracking-widest text-[10px]'
                    }`
                  }
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Configurações</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-zinc-800 space-y-3">
            <button 
              onClick={toggleViewMode}
              className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-zinc-300 hover:bg-zinc-900 rounded-xl transition-colors font-black uppercase tracking-widest text-[10px] border border-zinc-800"
            >
              {viewMode === 'mobile' ? (
                <>
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Desktop Mode</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Mobile Mode</span>
                </>
              )}
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors font-black uppercase tracking-widest text-[10px] border border-red-500/20"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
