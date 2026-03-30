import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Wallet, FileText } from 'lucide-react';

export const MobileLayout = () => {
  const navItems = [
    { name: 'Início', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Músicos', path: '/musicos', icon: Users },
    { name: 'Eventos', path: '/eventos', icon: Calendar },
    { name: 'Caixa', path: '/cashflow', icon: Wallet },
    { name: 'Contratos', path: '/contracts', icon: FileText },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-gray-100 font-sans md:max-w-md md:mx-auto md:border-x md:border-zinc-800 md:shadow-2xl">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full left-0 right-0 md:max-w-md md:mx-auto bg-zinc-900 border-t border-zinc-800 pb-safe">
        <ul className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center h-full w-full space-y-1 transition-colors duration-200 ${
                    isActive ? 'text-[#FF169B]' : 'text-zinc-500 hover:text-zinc-300'
                  }`
                }
              >
                <item.icon className="w-6 h-6" strokeWidth={2} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
