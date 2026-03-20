"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const isLightTheme = theme === 'light';

  const shellStyle = {
    background: isLightTheme
      ? 'radial-gradient(circle at top right, rgba(12, 95, 165, 0.10), transparent 28%), linear-gradient(180deg, #f7f9fc 0%, #eef2f6 100%)'
      : 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 28%), linear-gradient(180deg, #020c1b 0%, #041225 100%)',
  };

  const accentGlowClassName = isLightTheme ? 'bg-sky-500/10' : 'bg-blue-500/20';
  const secondaryGlowClassName = isLightTheme ? 'bg-cyan-500/10' : 'bg-cyan-500/20';
  const alertClassName = isLightTheme
    ? 'mb-4 rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm text-red-700 flex items-center gap-2'
    : 'mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 flex items-center gap-2';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!auth || !db) {
        setError('Firebase indisponível no momento. Tente novamente em instantes.');
        return;
      }

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/services');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: email,
          role: 'client',
          createdAt: new Date().toISOString()
        });
        router.push('/services');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorCode =
        typeof err === 'object' && err && 'code' in err ? String((err as { code?: string }).code) : '';

      if (errorCode === 'auth/invalid-credential') setError('Email ou senha incorretos.');
      else if (errorCode === 'auth/email-already-in-use') setError('Este email já está cadastrado.');
      else setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 animate-fade-in" style={shellStyle}>
      <div className="theme-panel max-w-md w-full rounded-[28px] p-8 relative overflow-hidden">
        <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl ${accentGlowClassName}`}></div>
        <div className={`absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-2xl ${secondaryGlowClassName}`}></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold theme-text-strong">{isLogin ? 'Bem-vindo' : 'Criar Conta'}</h2>
            <p className="theme-text-muted mt-2">{isLogin ? 'Acesse o sistema para continuar' : 'Preencha os dados abaixo'}</p>
          </div>

          {error ? (
            <div className={alertClassName}>
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 h-5 w-5 theme-text-subtle group-focus-within:text-blue-600 transition-colors" />
                <input type="text" placeholder="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="theme-input w-full rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 theme-text-subtle group-focus-within:text-blue-600 transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="theme-input w-full rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 theme-text-subtle group-focus-within:text-blue-600 transition-colors" />
              <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="theme-input w-full rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" />
            </div>

            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:from-blue-500 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-70">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm font-medium theme-text-body transition-colors hover:text-blue-600">
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
