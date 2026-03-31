import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Music4, Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/dashboard');
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-gray-100 md:max-w-md md:mx-auto md:border-x md:border-zinc-800">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo/Header */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#FF169B] to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-pink-900/40 animate-pulse">
            <Music4 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500 tracking-tighter">
            Pagode Finance
          </h1>
          <p className="text-zinc-600 mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-center">
            Gestão Administrativa do Grupo
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[40px] p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Acesso Restrito (E-mail)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pagode.com"
                  required
                  className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF169B]/30 focus:border-[#FF169B]/50 transition-all font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 text-white placeholder:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#FF169B]/30 focus:border-[#FF169B]/50 transition-all font-bold text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 mt-6 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-pink-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-50 text-xs"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Acessar Painel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-zinc-800/50">
             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest text-center italic">
               Apenas administradores autorizados.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
