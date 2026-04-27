"use client";

import React from 'react';
import { CreditCard, FileText, QrCode, ShieldCheck } from 'lucide-react';
import { ProductCategory } from '@/types';

interface DocsBeforeAfterVisualProps {
  title: string;
  category: ProductCategory;
  backgroundImage?: string;
  compact?: boolean;
}

interface VisualPreset {
  chip: string;
  beforeLabel: string;
  afterLabel: string;
  shortTitle: string;
  accentFrom: string;
  accentTo: string;
  accentSoft: string;
  paperTone: string;
}

function buildVisualPreset(title: string, category: ProductCategory): VisualPreset {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('cnh')) {
    return {
      chip: 'Documento veicular',
      beforeLabel: 'CNH em folha/arquivo',
      afterLabel: 'CNH no PVC',
      shortTitle: 'CNH',
      accentFrom: '#2563eb',
      accentTo: '#0f766e',
      accentSoft: 'rgba(37,99,235,0.16)',
      paperTone: '#f8fafc',
    };
  }

  if (normalizedTitle.includes('crlv')) {
    return {
      chip: 'Documento automotivo',
      beforeLabel: 'CRLV atual',
      afterLabel: 'CRLV em cartão PVC',
      shortTitle: 'CRLV',
      accentFrom: '#0f766e',
      accentTo: '#0c4a6e',
      accentSoft: 'rgba(15,118,110,0.15)',
      paperTone: '#f7fee7',
    };
  }

  if (normalizedTitle.includes('pescador amador')) {
    return {
      chip: 'Pesca amadora',
      beforeLabel: 'Licença/registro atual',
      afterLabel: 'Licença em PVC',
      shortTitle: 'PESCADOR',
      accentFrom: '#0f766e',
      accentTo: '#0c4a6e',
      accentSoft: 'rgba(13,148,136,0.16)',
      paperTone: '#ecfeff',
    };
  }

  if (normalizedTitle.includes('rgp') || normalizedTitle.includes('pescador profissional')) {
    return {
      chip: 'Pesca profissional',
      beforeLabel: 'Certificado/registro',
      afterLabel: 'RGP em PVC',
      shortTitle: 'RGP',
      accentFrom: '#0c4a6e',
      accentTo: '#2563eb',
      accentSoft: 'rgba(37,99,235,0.16)',
      paperTone: '#eff6ff',
    };
  }

  if (normalizedTitle.includes('tie')) {
    return {
      chip: 'Documento náutico',
      beforeLabel: 'Título atual',
      afterLabel: 'TIE no PVC',
      shortTitle: 'TIE',
      accentFrom: '#1d4ed8',
      accentTo: '#0f766e',
      accentSoft: 'rgba(29,78,216,0.16)',
      paperTone: '#eff6ff',
    };
  }

  if (normalizedTitle.includes('arrais') || normalizedTitle.includes('motonauta') || normalizedTitle.includes('cha')) {
    return {
      chip: 'Habilitação náutica',
      beforeLabel: 'CHA/documento atual',
      afterLabel: 'CHA em PVC',
      shortTitle: normalizedTitle.includes('motonauta') ? 'MOTONAUTA' : 'ARRAIS',
      accentFrom: '#1e293b',
      accentTo: '#0f766e',
      accentSoft: 'rgba(30,41,59,0.18)',
      paperTone: '#f8fafc',
    };
  }

  if (normalizedTitle.includes('estudantil')) {
    return {
      chip: 'Identificação escolar',
      beforeLabel: 'Comprovante/arquivo',
      afterLabel: 'Carteira estudantil PVC',
      shortTitle: 'ESTUDANTE',
      accentFrom: '#0c4a6e',
      accentTo: '#1d4ed8',
      accentSoft: 'rgba(14,116,144,0.16)',
      paperTone: '#eff6ff',
    };
  }

  if (normalizedTitle.includes('empresarial')) {
    return {
      chip: 'Uso corporativo',
      beforeLabel: 'Ficha/cadastro',
      afterLabel: 'Credencial PVC',
      shortTitle: 'EMPRESA',
      accentFrom: '#334155',
      accentTo: '#0f766e',
      accentSoft: 'rgba(51,65,85,0.16)',
      paperTone: '#f8fafc',
    };
  }

  if (normalizedTitle.includes('sus') || normalizedTitle.includes('convênio') || normalizedTitle.includes('convenio')) {
    return {
      chip: 'Saúde e convênio',
      beforeLabel: 'Cartão/arquivo atual',
      afterLabel: 'Cartão PVC reforçado',
      shortTitle: 'SAÚDE',
      accentFrom: '#15803d',
      accentTo: '#0f766e',
      accentSoft: 'rgba(21,128,61,0.16)',
      paperTone: '#f0fdf4',
    };
  }

  if (normalizedTitle.includes('cin')) {
    return {
      chip: 'Identificação nacional',
      beforeLabel: 'CIN atual',
      afterLabel: 'CIN no PVC',
      shortTitle: 'CIN',
      accentFrom: '#1d4ed8',
      accentTo: '#0f766e',
      accentSoft: 'rgba(29,78,216,0.16)',
      paperTone: '#eff6ff',
    };
  }

  if (normalizedTitle.includes('cpf')) {
    return {
      chip: 'Documento pessoal',
      beforeLabel: 'CPF digital',
      afterLabel: 'CPF no PVC',
      shortTitle: 'CPF',
      accentFrom: '#0c4a6e',
      accentTo: '#1d4ed8',
      accentSoft: 'rgba(14,116,144,0.16)',
      paperTone: '#eff6ff',
    };
  }

  if (normalizedTitle.includes('trabalho') || normalizedTitle.includes('ctps')) {
    return {
      chip: 'Documento trabalhista',
      beforeLabel: 'CTPS digital',
      afterLabel: 'CTPS no PVC',
      shortTitle: 'CTPS',
      accentFrom: '#334155',
      accentTo: '#0f766e',
      accentSoft: 'rgba(51,65,85,0.16)',
      paperTone: '#f8fafc',
    };
  }

  if (normalizedTitle.includes('eleitor')) {
    return {
      chip: 'Documento eleitoral',
      beforeLabel: 'e-Título/arquivo',
      afterLabel: 'Título em PVC',
      shortTitle: 'ELEITOR',
      accentFrom: '#1d4ed8',
      accentTo: '#4338ca',
      accentSoft: 'rgba(67,56,202,0.16)',
      paperTone: '#eef2ff',
    };
  }

  if (normalizedTitle.includes('reservista') || normalizedTitle.includes('incorporação') || normalizedTitle.includes('incorporacao')) {
    return {
      chip: 'Documento militar',
      beforeLabel: 'Certificado atual',
      afterLabel: 'Versão em PVC',
      shortTitle: 'MILITAR',
      accentFrom: '#3f3f46',
      accentTo: '#0f766e',
      accentSoft: 'rgba(63,63,70,0.18)',
      paperTone: '#fafaf9',
    };
  }

  return {
    chip: category === 'insurance' ? 'Credencial' : category === 'license' ? 'Carteira' : 'Documento',
    beforeLabel: 'Documento atual',
    afterLabel: 'Versão em PVC',
    shortTitle: category === 'insurance' ? 'CREDENCIAL' : category === 'license' ? 'CARTEIRA' : 'DOC PVC',
    accentFrom: '#0f766e',
    accentTo: '#2563eb',
    accentSoft: 'rgba(14,116,144,0.16)',
    paperTone: '#f8fafc',
  };
}

function truncateTitle(title: string) {
  if (title.length <= 34) return title;
  return `${title.slice(0, 31)}...`;
}

export function DocsBeforeAfterVisual({
  title,
  category,
  backgroundImage,
  compact = false,
}: DocsBeforeAfterVisualProps) {
  const preset = buildVisualPreset(title, category);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-[2px]"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,12,27,0.82),rgba(15,23,42,0.58))]" />
        </>
      )}

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top left, ${preset.accentSoft}, transparent 42%), linear-gradient(135deg, rgba(8,15,32,0.98), rgba(15,23,42,0.92))`,
        }}
      />

      <div className={`relative z-10 flex h-full flex-col ${compact ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
            {preset.chip}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Antes e depois
          </span>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div
            className="relative rounded-[24px] border border-slate-300/35 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
            style={{
              backgroundColor: preset.paperTone,
              transform: 'rotate(-6deg)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Antes</p>
                <h4 className="mt-2 text-sm font-black leading-tight text-slate-800">
                  {truncateTitle(title)}
                </h4>
              </div>
              <FileText className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-slate-300/75" />
              <div className="h-2 w-5/6 rounded-full bg-slate-300/65" />
              <div className="h-2 w-3/4 rounded-full bg-slate-300/55" />
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="space-y-1">
                <div className="h-2 w-16 rounded-full bg-slate-400/45" />
                <div className="h-2 w-12 rounded-full bg-slate-400/35" />
              </div>
              <div className="rounded-xl border border-slate-300/60 bg-white/85 p-2">
                <QrCode className="h-6 w-6 text-slate-500" />
              </div>
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {preset.beforeLabel}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(14,165,233,0.25)]"
              style={{ background: `linear-gradient(135deg, ${preset.accentFrom}, ${preset.accentTo})` }}
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
              PVC
            </span>
          </div>

          <div
            className="relative overflow-hidden rounded-[24px] border border-white/15 p-4 text-white shadow-[0_22px_46px_rgba(2,12,27,0.40)]"
            style={{
              background: `linear-gradient(145deg, ${preset.accentFrom}, ${preset.accentTo})`,
              transform: 'rotate(4deg)',
            }}
          >
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/12 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-black/20 blur-2xl" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">Depois</p>
                  <h4 className="mt-2 text-sm font-black leading-tight">
                    {preset.shortTitle}
                  </h4>
                </div>
                <ShieldCheck className="h-5 w-5 text-white/70" />
              </div>

              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Cartão final
                </p>
                <p className="mt-2 text-sm font-bold leading-tight text-white">
                  {truncateTitle(title)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-2 w-16 rounded-full bg-white/45" />
                    <div className="h-2 w-12 rounded-full bg-white/35" />
                  </div>
                  <div className="rounded-xl border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    PVC
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">
                {preset.afterLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
