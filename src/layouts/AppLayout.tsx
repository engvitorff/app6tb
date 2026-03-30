import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users as UsersIcon, Calendar, Wallet, FileText, UserCircle, Settings, Monitor, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AppLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const navigate = useNavigate();
  const userName = localStorage.getItem('pagode_finance_user') || 'Usuário';

  const navItems = [
    { name: 'Início', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Músicos', path: '/musicos', icon: UsersIcon },
    { name: 'Eventos', path: '/eventos', icon: Calendar },
    { name: 'Caixa', path: '/cashflow', icon: Wallet },
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
    closeDrawer(); // Opcional: fechar a gaveta ao trocar de modo para melhor UX
  };

  // Dinâmico: Se for mobile, restringe a largura centralizada. Caso contrário, tela cheia fluida!
  const layoutClasses = viewMode === 'mobile' 
    ? "md:max-w-md md:mx-auto md:border-x md:border-zinc-800 md:shadow-2xl" 
    : "w-full";

  return (
    <div className={`flex flex-col min-h-screen bg-zinc-950 text-gray-100 font-sans relative transition-all duration-300 ${layoutClasses}`}>
      
      {/* Top App Bar - Toggles sticky classes logic based on viewMode */}
      <header className={`fixed top-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 h-16 z-30 flex items-center px-4 justify-between transition-all duration-300 ${viewMode === 'mobile' ? 'md:max-w-md md:mx-auto' : ''}`}>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 -ml-2 text-zinc-300 hover:text-white transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
          Pagode Finance
        </span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden pt-20 pb-10">
        <Outlet />
      </main>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar / Drawer - Removed 'md:left-auto md:max-w-md' bugs */}
      <div className={`fixed top-0 left-0 w-72 h-full bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* User Profile Area */}
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
            <p className="text-sm text-zinc-500">Administrador</p>
          </div>

          {/* Navigation Links */}
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
                          ? 'bg-[#FF169B]/10 text-[#FF169B] font-semibold' 
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            
            <div className="mt-8 px-6 mb-2">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Sistema</p>
            </div>
            <ul className="space-y-1 px-3">
              <li>
                <NavLink
                  to="/usuarios"
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#FF169B]/10 text-[#FF169B] font-semibold' 
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`
                  }
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Meu Cadastro</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Action Buttons at Bottom */}
          <div className="p-4 border-t border-zinc-800 space-y-3">
            {/* View Mode Toggle Button */}
            <button 
              onClick={toggleViewMode}
              className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-zinc-300 hover:bg-zinc-900 rounded-xl transition-colors font-medium border border-zinc-800"
            >
              {viewMode === 'mobile' ? (
                <>
                  <Monitor className="w-5 h-5 text-indigo-400" />
                  <span>Ver como Desktop</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>Ver como Mobile</span>
                </>
              )}
            </button>
            
            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="w-full py-3 px-4 flex items-center justify-center space-x-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors font-medium border border-red-500/20"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
