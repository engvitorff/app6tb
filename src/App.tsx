import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as api from './services/api';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Musicians } from './pages/Musicians';
import { Events } from './pages/Events';
import { Users } from './pages/Users';
import { EventDetails } from './pages/EventDetails';
import { Contracts } from './pages/Contracts';
import { Extrato } from './pages/Extrato';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  useEffect(() => {
    const handleMpAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code && !window.location.href.includes('error=')) {
        try {
          console.log('Detectado código do Mercado Pago, vinculando...');
          // Usamos a URL base para o redirectUri para bater com o que está no painel do MP
          const redirectUri = window.location.origin + '/';
          await api.connectMercadoPago(code, redirectUri);
          
          // Limpa a URL e avisar o usuário
          window.history.replaceState({}, document.title, window.location.pathname);
          alert('Mercado Pago vinculado com sucesso! Agora você pode ver seu saldo no Dashboard.');
          window.location.reload(); // Forçar refresh para atualizar todos os componentes
        } catch (err: any) {
          console.error('Erro no vínculo global:', err);
          // O erro de "Invalid JWT" deve ter sido resolvido pelo apikey, 
          // mas se houver outro, ele aparecerá aqui.
        }
      }
    };
    handleMpAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/musicos" element={<Musicians />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/eventos/:id" element={<EventDetails />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/cashflow" element={<Dashboard />} />
            <Route path="/extrato" element={<Extrato />} />
            <Route path="/contracts" element={<Contracts />} />
          </Route>
        </Route>
        
        {/* Default route redirect based on auth */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
