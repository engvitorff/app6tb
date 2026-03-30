import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Music4, Mail, Lock, LogIn, UserPlus, Github, Chrome, AlertCircle, Loader2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu e-mail para confirmação (se ativo no Supabase) ou tente logar.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Google.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-gray-100 md:max-w-md md:mx-auto md:border-x md:border-zinc-800">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo/Header */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#FF169B] to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-pink-900/30 animate-pulse">
            <Music4 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
            Pagode Finance
          </h1>
          <p className="text-zinc-500 mt-2 text-sm text-center">
            {isSignUp ? 'Crie sua conta para começar a gerenciar.' : 'Gestão financeira simplificada para seu grupo.'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#FF169B] focus:border-[#FF169B]/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#FF169B] focus:border-[#FF169B]/50 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-900 px-2 text-zinc-500 uppercase tracking-widest font-bold">ou continue com</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full h-11 bg-white text-zinc-950 font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-200 active:scale-[0.98] transition-all"
            >
              <Chrome className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Conta Google</span>
            </button>
          </div>

          {/* Switch Mode */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-zinc-400 text-xs hover:text-[#FF169B] transition-colors font-medium"
            >
              {isSignUp ? 'Já tem uma conta? Entre agora' : 'Não tem conta? Crie uma agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
