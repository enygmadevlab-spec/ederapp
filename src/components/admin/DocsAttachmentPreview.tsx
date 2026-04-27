"use client";

import React from 'react';
import { CreditCard, FileImage, ScanSearch, ShipWheel, FileText } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { DocumentOcrStatus, MarineDocumentFields } from '@/lib/docsOcr';

type DocsAttachmentPreviewProps = {
  documentLabel: string;
  productTitle: string;
  productImage?: string;
  clientName: string;
  clientDocument: string;
  clientBirthDate: string;
  clientCity: string;
  sourceFileName: string;
  sourcePreviewUrl: string;
  sourceKind: 'image' | 'pdf' | 'other';
  ocrStatus: DocumentOcrStatus;
  ocrProgress?: number;
  ocrConfidence?: number;
  parsedFields?: MarineDocumentFields;
  ocrText?: string;
  qrText?: string;
  warning?: string;
};

function getCardCode(title: string) {
  const upperTitle = title.toUpperCase();

  if (upperTitle.includes('CNH')) return 'CNH';
  if (upperTitle.includes('CRLV')) return 'CRLV';
  if (upperTitle.includes('TIE')) return 'TIE';
  if (upperTitle.includes('CHA')) return 'CHA';
  if (upperTitle.includes('CPF')) return 'CPF';
  if (upperTitle.includes('CIN')) return 'CIN';
  if (upperTitle.includes('SUS')) return 'SUS';
  if (upperTitle.includes('RGP')) return 'RGP';

  const compact = title
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return compact || 'PVC';
}

function QrVisual({ seed }: { seed: string }) {
  const normalizedSeed = seed || 'docs-pvc-preview';
  const cells: React.ReactNode[] = [];
  const size = 21;

  const isFinderCell = (row: number, col: number, rowStart: number, colStart: number) =>
    row >= rowStart &&
    row < rowStart + 7 &&
    col >= colStart &&
    col < colStart + 7 &&
    (row === rowStart ||
      row === rowStart + 6 ||
      col === colStart ||
      col === colStart + 6 ||
      (row >= rowStart + 2 && row <= rowStart + 4 && col >= colStart + 2 && col <= colStart + 4));

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const isFinder =
        isFinderCell(row, col, 0, 0) ||
        isFinderCell(row, col, 0, size - 7) ||
        isFinderCell(row, col, size - 7, 0);

      const seedChar = normalizedSeed.charCodeAt((row * size + col) % normalizedSeed.length);
      const isFilled = isFinder || (row > 6 && col > 6 && ((row * 11 + col * 7 + seedChar) % 5 === 0));

      if (!isFilled) continue;

      cells.push(<rect key={`${row}-${col}`} x={col} y={row} width="1" height="1" rx="0.15" />);
    }
  }

  return (
    <svg viewBox="0 0 21 21" className="h-14 w-14 rounded-lg bg-white p-1.5 text-slate-950 shadow-sm">
      {cells}
    </svg>
  );
}

function marineValue(primary?: string, fallback?: string) {
  return primary?.trim() || fallback?.trim() || 'A definir';
}

function isMarineCard(title: string) {
  return /tie|tiem|embarca|barco|vessel|pesca/i.test(title);
}

function MarineCards({
  productTitle,
  productImage,
  clientName,
  clientDocument,
  clientCity,
  parsedFields,
}: {
  productTitle: string;
  productImage?: string;
  clientName: string;
  clientDocument: string;
  clientCity: string;
  parsedFields?: MarineDocumentFields;
}) {
  const frontRows = [
    { label: 'Inscrição', value: marineValue(parsedFields?.registrationNumber) },
    { label: 'Embarcação', value: marineValue(parsedFields?.vesselName, productTitle) },
    { label: 'Tipo', value: marineValue(parsedFields?.vesselType) },
    { label: 'Validade', value: marineValue(parsedFields?.expirationDate) },
  ];

  const backRows = [
    { label: 'Proprietário', value: marineValue(parsedFields?.ownerName, clientName) },
    { label: 'CPF/CNPJ', value: marineValue(parsedFields?.ownerDocument, clientDocument) },
    { label: 'Propulsão', value: marineValue(parsedFields?.propulsionType) },
    { label: 'Motores', value: marineValue(parsedFields?.engineCount) },
    { label: 'Área', value: marineValue(parsedFields?.navigationArea, clientCity) },
    { label: 'Compr.', value: marineValue(parsedFields?.length) },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      <div
        className="relative h-44 overflow-hidden rounded-[20px] border border-white/10 shadow-[0_18px_45px_rgba(2,12,27,0.18)]"
        style={{
          backgroundImage: productImage
            ? `linear-gradient(145deg, rgba(2,12,27,0.55), rgba(14,165,233,0.18)), url(${productImage})`
            : 'linear-gradient(145deg, #0f2f48, #0b7ac0)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/82 via-[#0b7ac0]/42 to-[#14b8a6]/32" />
        <div className="absolute inset-0 flex flex-col justify-between p-3.5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100/85">Docs PVC Náutico</p>
              <h6 className="mt-1 text-sm font-black tracking-wide">TIE Compacto</h6>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-emerald-100/85">Frente</p>
            </div>
            <QrVisual seed={`${parsedFields?.registrationNumber || clientDocument}-${productTitle}`} />
          </div>

          <div className="space-y-1.5">
            {frontRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 text-[10px] backdrop-blur-sm">
                <span className="uppercase tracking-[0.18em] text-sky-100/72">{row.label}</span>
                <span className="min-w-0 truncate text-right font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-[#0b1524] p-3.5 shadow-[0_16px_34px_rgba(2,12,27,0.2)]">
        <div className="mb-3 flex items-center justify-between gap-3 text-white">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Verso</p>
            <p className="mt-1 text-sm font-bold">Dados essenciais para PVC padrão</p>
          </div>
          <ShipWheel className="h-5 w-5 text-cyan-300" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-100">
          {backRows.map((row) => (
            <div key={row.label} className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
              <p className="uppercase tracking-[0.16em] text-slate-400">{row.label}</p>
              <p className="mt-1 break-words font-semibold">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocsAttachmentPreview({
  documentLabel,
  productTitle,
  productImage,
  clientName,
  clientDocument,
  clientBirthDate,
  clientCity,
  sourceFileName,
  sourcePreviewUrl,
  sourceKind,
  ocrStatus,
  ocrProgress,
  ocrConfidence,
  parsedFields,
  ocrText,
  qrText,
  warning,
}: DocsAttachmentPreviewProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const cardCode = getCardCode(productTitle);
  const marineCard = isMarineCard(productTitle);
  const ocrReady = ocrStatus === 'done';
  const ocrError = ocrStatus === 'error';
  const ocrProcessing = ocrStatus === 'processing';
  const parsedEntries = Object.entries(parsedFields || {}).filter(([, value]) => value && value.trim().length > 0);

  return (
    <div
      className="rounded-2xl border border-sky-500/20 p-4"
      style={{ backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.03)' }}
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-sky-400" />
        <div>
          <h5 className="text-sm font-bold text-white">Prévia visual Docs PVC</h5>
          <p className="text-[11px] text-slate-400">Documento base anexado, OCR e cartão renderizado.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div
          className="overflow-hidden rounded-2xl border border-sky-500/20"
          style={{ backgroundColor: isLight ? '#f7f9fb' : 'rgba(2, 12, 27, 0.45)' }}
        >
          <div className="flex items-center justify-between border-b border-sky-500/20 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Documento base</p>
              <p className="text-xs font-semibold text-white">{documentLabel}</p>
            </div>
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
              {sourceKind === 'pdf' ? 'PDF' : sourceKind === 'image' ? 'Imagem' : 'Arquivo'}
            </span>
          </div>

          <div className="h-44 overflow-hidden bg-white">
            {sourceKind === 'other' ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                <FileText className="h-10 w-10 text-sky-400" />
                <p className="text-sm font-semibold text-slate-800">{sourceFileName}</p>
                <p className="text-xs text-slate-500">Prévia não suportada para esse formato.</p>
              </div>
            ) : (
              <img src={sourcePreviewUrl} alt={sourceFileName} className="h-full w-full object-contain" />
            )}
          </div>

          <div className="border-t border-sky-500/20 px-3 py-2 text-[11px] text-slate-400">{sourceFileName}</div>
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-emerald-500/20"
          style={{ backgroundColor: isLight ? '#f7f9fb' : 'rgba(2, 12, 27, 0.45)' }}
        >
          <div className="flex items-center justify-between border-b border-emerald-500/20 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cartão renderizado</p>
              <p className="text-xs font-semibold text-white">{marineCard ? 'Layout náutico PVC' : 'Frente em PVC'}</p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              Preview
            </span>
          </div>

          <div className="p-3">
            {marineCard ? (
              <MarineCards
                productTitle={productTitle}
                productImage={productImage}
                clientName={clientName}
                clientDocument={clientDocument}
                clientCity={clientCity}
                parsedFields={parsedFields}
              />
            ) : (
              <div
                className="relative h-44 overflow-hidden rounded-[20px] border border-white/10 shadow-[0_18px_45px_rgba(2,12,27,0.18)]"
                style={{
                  backgroundImage: productImage
                    ? `linear-gradient(145deg, rgba(2,12,27,0.35), rgba(14,165,233,0.15)), url(${productImage})`
                    : 'linear-gradient(145deg, #0f2f48, #0b7ac0)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/72 via-[#0b7ac0]/35 to-[#14b8a6]/28" />
                <div className="absolute inset-0 flex flex-col justify-between p-3.5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100/85">Docs PVC</p>
                      <h6 className="mt-1 text-sm font-black tracking-wide">{cardCode}</h6>
                    </div>
                    <QrVisual seed={`${clientDocument}-${clientName}-${productTitle}`} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm">
                      <p className="text-[9px] uppercase tracking-[0.24em] text-sky-100/80">Titular</p>
                      <p className="truncate text-sm font-bold">{clientName || 'Nome em preenchimento'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="rounded-xl border border-white/10 bg-white/8 px-2 py-1.5 backdrop-blur-sm">
                        <p className="uppercase tracking-[0.18em] text-sky-100/75">Documento</p>
                        <p className="truncate pt-0.5 font-semibold">{clientDocument || 'A definir'}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/8 px-2 py-1.5 backdrop-blur-sm">
                        <p className="uppercase tracking-[0.18em] text-sky-100/75">Nascimento</p>
                        <p className="truncate pt-0.5 font-semibold">{clientBirthDate || 'A definir'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/8 px-2.5 py-1.5 text-[10px] backdrop-blur-sm">
                      <div className="min-w-0">
                        <p className="uppercase tracking-[0.18em] text-sky-100/75">Cidade / UF</p>
                        <p className="truncate pt-0.5 font-semibold">{clientCity || 'Nao informado'}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sky-100/85">
                        <FileImage className="h-3.5 w-3.5" />
                        <span className="font-semibold">{sourceKind === 'pdf' ? 'Base PDF' : 'Base imagem'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-2 text-[11px] text-slate-400">
              {marineCard
                ? 'Modelo técnico compacto com seleção dos campos essenciais para cartão PVC padrão.'
                : 'Prévia ilustrativa para conferência visual antes de gerar o cartão.'}
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-4 rounded-2xl border border-cyan-500/20 p-3"
        style={{ backgroundColor: isLight ? '#f7f9fb' : 'rgba(8, 145, 178, 0.08)' }}
      >
        <div className="flex items-center gap-2">
          <ScanSearch className="h-4 w-4 text-cyan-300" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">OCR técnico</p>
            <p className="text-[11px] text-slate-400">Leitura automática com texto nativo do PDF, QR Code e OCR usando `pdfjs-dist`, `@zxing/browser`, `jsqr` e `tesseract.js`.</p>
          </div>
          {ocrProcessing ? (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              Lendo {ocrProgress || 0}%
            </span>
          ) : null}
          {ocrReady ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              OCR {Math.round(ocrConfidence || 0)}%
            </span>
          ) : null}
          {ocrError ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              OCR incompleto
            </span>
          ) : null}
        </div>

        {parsedEntries.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            {parsedEntries.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
                <p className="uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-1 break-words font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {warning ? (
          <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-100">
            <p className="font-semibold uppercase tracking-[0.16em] text-amber-200">Atenção técnica</p>
            <p className="mt-1 leading-5">{warning}</p>
          </div>
        ) : null}

        {qrText ? (
          <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[11px] text-emerald-100">
            <p className="font-semibold uppercase tracking-[0.16em] text-emerald-200">QR lido</p>
            <p className="mt-1 break-all leading-5">{qrText}</p>
          </div>
        ) : null}

        {ocrText ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] text-slate-300">
            <p className="mb-1 font-semibold uppercase tracking-[0.16em] text-slate-500">Texto OCR</p>
            <p className="line-clamp-4 whitespace-pre-line">{ocrText}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
