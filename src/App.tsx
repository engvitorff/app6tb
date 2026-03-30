import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Musicians } from './pages/Musicians';
import { Events } from './pages/Events';
import { Users } from './pages/Users';
import { EventDetails } from './pages/EventDetails';
import { Contracts } from './pages/Contracts';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/musicos" element={<Musicians />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/eventos/:id" element={<EventDetails />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/cashflow" element={<Dashboard />} />
            <Route path="/contracts" element={<Contracts />} />
          </Route>
        </Route>
        
        {/* Default route redirect based on auth */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
