"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Download, MonitorSmartphone, Share2, X } from 'lucide-react';
import {
  BROWSER_INSTALL_STEPS,
  IOS_INSTALL_STEPS,
  LOCAL_STORAGE_KEYS,
} from '@/lib/appConfig';

interface DeferredInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isIosDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallAppBanner() {
  const [promptEvent, setPromptEvent] = useState<DeferredInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const ios = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(LOCAL_STORAGE_KEYS.installDismissed) === '1');
    setIsStandalone(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as DeferredInstallPromptEvent);
    };

    const handleInstalled = () => {
      setPromptEvent(null);
      setIsStandalone(true);
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.installDismissed, '1');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (dismissed || isStandalone || (!ios && !promptEvent)) {
    return null;
  }

  const closeBanner = () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.installDismissed, '1');
    setDismissed(true);
  };

  const installApp = async () => {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    const result = await promptEvent.userChoice;

    if (result.outcome === 'accepted') {
      closeBanner();
      return;
    }

    setPromptEvent(null);
  };

  const steps = ios ? IOS_INSTALL_STEPS : BROWSER_INSTALL_STEPS;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[90] sm:left-auto sm:w-[420px]">
      <div className="theme-panel rounded-[28px] border p-5 shadow-[0_24px_60px_rgba(2,12,27,0.28)] backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/20">
            {ios ? <Share2 className="h-5 w-5" /> : <MonitorSmartphone className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] theme-text-subtle">
                  App instalável
                </p>
                <h3 className="mt-1 text-lg font-black theme-text-strong">
                  Instale no computador ou celular
                </h3>
              </div>
              <button
                type="button"
                onClick={closeBanner}
                className="rounded-full p-2 theme-toggle"
                aria-label="Fechar aviso de instalação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 theme-text-body">
              Abra o EderApp como app local no Windows, macOS, Android ou iPhone para usar com
              navegação mais rápida e experiência de tela cheia.
            </p>

            <ol className="mt-4 space-y-2 text-sm theme-text-muted">
              {steps.map((step) => (
                <li key={step} className="flex gap-2">
                  <span className="theme-accent font-bold">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {!ios ? (
              <button
                type="button"
                onClick={() => void installApp()}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-400"
              >
                <Download className="h-4 w-4" />
                Instalar aplicativo
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
