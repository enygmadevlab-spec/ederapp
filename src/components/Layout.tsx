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
  const activeTheme = mounted ? theme : 'light';
  const nextThemeLabel = activeTheme === 'light' ? 'Modo Noturno' : 'Modo Claro';
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
              <Link href="/docs-cards" className={`text-sm font-semibold transition-colors duration-300 ${pathname === '/docs-cards' ? 'theme-accent drop-shadow-[0_0_8px_rgba(14,165,233,0.35)]' : `theme-text-body ${navHoverClassName}`}`}>
                💳 Docs PVC
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
                {activeTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>{nextThemeLabel}</span>
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
                <Link href="/docs-cards" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium theme-text-body hover:bg-white/5 rounded-md">Docs PVC</Link>
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
                  {nextThemeLabel}
                </button>
             </div>
          </div>
        )}
      </header>

      <main className="flex-grow relative">
        {children}
      </main>

      <FloatingCart />

      <footer className="theme-footer py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 border-b pb-6 md:grid-cols-[1.35fr_1fr_1fr]" style={{ borderColor: 'var(--theme-nav-border)' }}>
            <div className="max-w-md">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-blue-600 p-1.5">
                  <Anchor className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="theme-text-strong text-base font-bold leading-none">Eder Martins</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.24em] theme-text-subtle">Assessoria Náutica</p>
                </div>
              </div>
              <p className="text-sm leading-6 theme-text-muted">
                Regularização náutica e documentos em PVC com atendimento objetivo, seguro e suporte online em todo o Brasil.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] theme-text-subtle">Contato</h3>
              <div className="space-y-2 text-sm">
                <a
                  href="https://wa.me/5548996241068"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block theme-text-body transition-colors ${footerHoverClassName}`}
                >
                  WhatsApp: (48) 99624-1068
                </a>
                <a
                  href="mailto:pescasulbrasil@gmail.com"
                  className={`block theme-text-body transition-colors ${footerHoverClassName}`}
                >
                  Email: pescasulbrasil@gmail.com
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] theme-text-subtle">Atendimento</h3>
              <p className="text-sm leading-6 theme-text-body">Segunda a sexta, 08:00 às 18:00</p>
              <p className="mt-2 text-sm leading-6 theme-text-muted">
                Retorno rápido por WhatsApp e email.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 text-xs theme-text-subtle md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Eder Martins Assessoria Náutica. Todos os direitos reservados.</p>
            <p>Atendimento nacional com operação digital.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
