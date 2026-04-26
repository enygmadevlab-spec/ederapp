"use client";

import Link from 'next/link';
import { ArrowRight, CreditCard, Anchor } from 'lucide-react';
import {
  BUSINESS_IMAGES,
  BUSINESS_ROUTES,
  BUSINESS_SUMMARIES,
  BUSINESS_NAMES,
} from '@/lib/businessSegments';

interface BusinessSectionsCardsProps {
  nauticaCount: number;
  docsCount: number;
}

const SECTION_CONFIG = {
  nautica: {
    icon: Anchor,
    badge: 'Fluxo atual preservado',
    bullets: ['Catálogo náutico', 'Regularização e licenças', 'Mesmo checkout do app'],
  },
  docs: {
    icon: CreditCard,
    badge: 'Nova empresa no mesmo app',
    bullets: ['Cartões em PVC', 'Credenciais e documentos', 'Admin próprio no painel'],
  },
} as const;

export function BusinessSectionsCards({
  nauticaCount,
  docsCount,
}: BusinessSectionsCardsProps) {
  const items = [
    {
      id: 'nautica' as const,
      count: nauticaCount,
      cta: 'Ver serviços náuticos',
      accent: 'from-sky-600/90 via-cyan-500/70 to-slate-950/90',
      chip: 'text-sky-200 border-sky-400/30 bg-sky-500/10',
    },
    {
      id: 'docs' as const,
      count: docsCount,
      cta: 'Ver docs em PVC',
      accent: 'from-emerald-600/90 via-teal-500/70 to-slate-950/90',
      chip: 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10',
    },
  ];

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="theme-accent text-xs font-black uppercase tracking-[0.35em]">
            Dois catálogos independentes
          </span>
          <h2 className="mt-4 text-4xl font-black tracking-tight theme-text-strong sm:text-5xl">
            Escolha a frente de atendimento
          </h2>
          <p className="mt-4 text-base leading-7 theme-text-muted sm:text-lg">
            O app continua com a operação náutica e agora também abre uma empresa separada para
            documentos PVC, cada uma com sua própria seção.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {items.map(({ id, count, cta, accent, chip }) => {
            const config = SECTION_CONFIG[id];
            const Icon = config.icon;

            return (
              <article
                key={id}
                className="theme-panel group overflow-hidden rounded-[32px] border shadow-[0_24px_70px_rgba(2,12,27,0.16)]"
                style={{ borderColor: 'var(--theme-surface-border)' }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={BUSINESS_IMAGES[id]}
                    alt={BUSINESS_NAMES[id]}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_42%)]" />

                  <div className="absolute left-6 top-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] ${chip}`}>
                      {config.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/75">
                      {count} itens publicados
                    </p>
                    <h3 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                      {BUSINESS_NAMES[id]}
                    </h3>
                  </div>
                </div>

                <div className="p-8">
                  <p className="text-base leading-7 theme-text-muted">
                    {BUSINESS_SUMMARIES[id]}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {config.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold theme-text-body"
                        style={{ borderColor: 'var(--theme-surface-border)', backgroundColor: 'rgba(255,255,255,0.04)' }}
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={BUSINESS_ROUTES[id]}
                    className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-cyan-400"
                  >
                    {cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
