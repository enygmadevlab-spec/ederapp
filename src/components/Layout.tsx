"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Anchor, ShoppingCart, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { FloatingCart } from './FloatingCart';
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const isLightTheme = theme === 'light';
  const navHoverClassName = isLightTheme ? 'hover:text-sky-700' : 'hover:text-sky-300';
  const iconHoverClassName = isLightTheme ? 'hover:text-sky-700' : 'hover:text-sky-400';
  const footerHoverClassName = isLightTheme ? 'hover:text-sky-700' : 'hover:text-blue-400';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 theme-nav shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-sky-600 to-cyan-500 p-2.5 rounded-xl shadow-lg group-hover:shadow-sky-500/50 transition-all duration-300 group-hover:scale-110">
                <Anchor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold theme-text-strong leading-none tracking-tight">EDER MARTINS</h1>
                <p className="text-[10px] theme-accent uppercase tracking-[0.2em] mt-1">🚤 Assessoria Náutica</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/services" className={`text-sm font-semibold transition-colors duration-300 ${pathname === '/services' ? 'theme-accent drop-shadow-[0_0_8px_rgba(14,165,233,0.35)]' : `theme-text-body ${navHoverClassName}`}`}>
                🎯 Serviços
              </Link>

              {user ? (
                <>
                  {user.role === 'client' && (
                    <Link href="/dashboard/client" className={`text-sm font-semibold theme-text-body transition-colors ${navHoverClassName}`}>📋 Meus Pedidos</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link href="/dashboard/admin" className={`text-sm font-semibold theme-text-body transition-colors ${navHoverClassName}`}>⚙️ Painel Admin</Link>
                  )}
                  {user.role === 'employee' && (
                    <Link href="/dashboard/employee" className={`text-sm font-semibold theme-text-body transition-colors ${navHoverClassName}`}>👥 Painel Colaborador</Link>
                  )}
                  <div className="flex items-center gap-4 ml-4 pl-4 border-l" style={{ borderColor: 'var(--theme-surface-border)' }}>
                    <span className="text-sm theme-text-muted">Olá, <span className="theme-text-strong font-semibold">{user.name.split(' ')[0]}</span></span>
                    <button onClick={handleLogout} className="theme-text-muted hover:text-red-400 transition-colors">
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login" className={`flex items-center gap-2 text-sm font-semibold theme-text-body transition-colors px-4 py-2 rounded-lg theme-panel-soft ${navHoverClassName}`}>
                  🔓 Entrar
                </Link>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="theme-toggle flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                aria-label="Alternar modo claro e escuro"
              >
                {mounted && theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>{mounted && theme === 'light' ? 'Modo Noturno' : 'Modo Claro'}</span>
              </button>

              {(!user || user.role === 'client') && (
                <Link href="/checkout" className={`relative p-2 theme-text-body transition-colors hover:scale-110 duration-300 ${iconHoverClassName}`}>
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-lg animate-bounce">
                      {cart.length}
                    </span>
                  )}
                </Link>
              )}
            </nav>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-2 theme-text-body ${iconHoverClassName}`}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden theme-nav absolute w-full z-50">
             <div className="px-4 pt-2 pb-4 space-y-1">
                <Link href="/services" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium theme-text-body hover:bg-white/5 rounded-md">Serviços</Link>
                {user ? (
                   <>
                    <Link href={`/dashboard/${user.role}`} onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium theme-text-body hover:bg-white/5 rounded-md">Painel</Link>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-red-400 hover:bg-white/5 rounded-md">Sair</button>
                   </>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium theme-text-body hover:bg-white/5 rounded-md">Login</Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className="theme-toggle mt-2 w-full rounded-md px-3 py-3 text-left text-base font-semibold"
                >
                  {mounted && theme === 'light' ? 'Modo Noturno' : 'Modo Claro'}
                </button>
             </div>
          </div>
        )}
      </header>

      <main className="flex-grow relative">
        {children}
      </main>

      <FloatingCart />

      <footer className="theme-footer py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
               <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Anchor className="h-4 w-4 text-white" />
               </div>
               <h3 className="theme-text-strong font-bold text-lg">Eder Martins</h3>
            </div>
            <p className="text-sm leading-relaxed theme-text-muted">
              Especialista em documentação náutica. Regularize sua embarcação com agilidade, segurança e transparência.
            </p>
          </div>
          <div>
            <h3 className="theme-text-strong font-semibold mb-4 text-sm uppercase tracking-wider">Contato</h3>
            <ul className="space-y-3">
              <li className={`flex items-center gap-2 text-sm theme-text-body transition-colors cursor-pointer ${footerHoverClassName}`}>
                WhatsApp: (48) 99624-1068
              </li>
              <li className={`flex items-center gap-2 text-sm theme-text-body transition-colors cursor-pointer ${footerHoverClassName}`}>
                Email: pescasulbrasil@gmail.com
              </li>
            </ul>
          </div>
          <div>
            <h3 className="theme-text-strong font-semibold mb-4 text-sm uppercase tracking-wider">Atendimento</h3>
            <p className="text-sm theme-text-muted">Segunda a Sexta<br />08:00 - 18:00</p>
            <div className="mt-4 flex gap-4">
              <div className="w-8 h-8 rounded-full theme-panel-soft hover:bg-blue-600 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full theme-panel-soft hover:bg-blue-600 transition-colors cursor-pointer"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 text-center text-xs theme-text-subtle" style={{ borderTop: '1px solid var(--theme-nav-border)' }}>
          © {new Date().getFullYear()} Eder Martins Assessoria Náutica. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};
