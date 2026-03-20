"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Lock, Mail, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
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
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError('Email ou senha incorretos.');
      else if (err.code === 'auth/email-already-in-use') setError('Este email já está cadastrado.');
      else setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">{isLogin ? 'Bem-vindo' : 'Criar Conta'}</h2>
            <p className="text-slate-500 mt-2">{isLogin ? 'Acesse o sistema para continuar' : 'Preencha os dados abaixo'}</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input type="text" placeholder="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400" />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center transform hover:scale-[1.02]">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors">
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}