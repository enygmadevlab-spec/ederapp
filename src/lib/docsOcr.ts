"use client";

export type DocumentOcrStatus = 'idle' | 'processing' | 'done' | 'error';

export type MarineDocumentFields = {
  registrationNumber?: string;
  vesselName?: string;
  vesselType?: string;
  expirationDate?: string;
  ownerName?: string;
  ownerDocument?: string;
  propulsionType?: string;
  engineCount?: string;
  navigationArea?: string;
  length?: string;
  hullNumber?: string;
  issueDate?: string;
};

export type DocumentInsight = {
  previewUrl: string;
  rawText: string;
  confidence: number;
  parsedFields: MarineDocumentFields;
  qrText?: string;
  warning?: string;
};

type RenderedDocumentPreview = {
  sourceUrl: string;
  previewUrl: string;
  pdfText?: string;
};

function normalizeOcrText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeComparableText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const LABEL_NOISE_TERMS = [
  'registration number',
  'numero de inscricao',
  'numero de inscrição',
  'type of vessel',
  'tipo da embarcacao',
  'tipo da embarcação',
  'expiration date',
  'data de validade',
  'owner',
  'proprietario',
  'proprietário',
  'cpf/cnpj',
  'type of propulsion',
  'tipo de propulsao',
  'tipo de propulsão',
  'quantity of engines',
  'quantidade de motores',
  'navigation area',
  'area de navegacao',
  'área de navegação',
  'length',
  'comprimento',
  'hull number',
  'casco',
  'date of issue',
  'data de emissao',
  'data de emissão',
  'place of issue',
  'name of vessel',
  'nome da embarcacao',
  'nome da embarcação',
  'documento da embarcacao',
  'documento da embarcação',
  'titulo de inscricao de embarcacao',
  'título de inscrição de embarcação',
  'presentation of document',
  'documento complementar',
];

function stripNoise(value: string) {
  return value
    .replace(/^[\s/|:;.,-]+/, '')
    .replace(/[\s/|:;.,-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function looksLikeLabelNoise(value: string) {
  const normalized = normalizeComparableText(value);
  if (!normalized) return true;
  if (normalized.startsWith('/')) return true;
  if (normalized.includes(' / ')) return true;
  if (normalized.includes(' | ')) return true;
  if (LABEL_NOISE_TERMS.some((term) => normalized.includes(term))) return true;
  return false;
}

function parseField(text: string, labels: string[]) {
  const linePattern = labels.map(escapeRegExp).join('|');
  const sameLine = new RegExp(`(?:${linePattern})\\s*[:\\-]?\\s*([^\\n]{2,90})`, 'i');
  const directMatch = text.match(sameLine);

  if (directMatch?.[1]) {
    const cleaned = stripNoise(directMatch[1]);
    if (cleaned && cleaned.length > 1) {
      return cleaned;
    }
  }

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (labels.some((label) => new RegExp(escapeRegExp(label), 'i').test(line))) {
      const nextLine = lines[index + 1];
      if (nextLine && nextLine.length > 1 && !/[A-Z]{3,}.*\/.*[A-Z]{3,}/.test(nextLine)) {
        return stripNoise(nextLine);
      }
    }
  }

  return '';
}

function matchPatterns(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const candidate = stripNoise(match[1] || match[0] || '');
    if (candidate) {
      return candidate;
    }
  }

  return '';
}

function parseFieldNextLine(text: string, labels: string[]) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (labels.some((label) => new RegExp(escapeRegExp(label), 'i').test(line))) {
      const nextLine = lines[index + 1];
      if (nextLine && nextLine.length > 1 && !/[A-Z]{3,}.*\/.*[A-Z]{3,}/.test(nextLine)) {
        return stripNoise(nextLine);
      }
    }
  }

  return '';
}

function sanitizeMarineField(field: keyof MarineDocumentFields, value: string) {
  const cleaned = stripNoise(value);
  if (!cleaned || looksLikeLabelNoise(cleaned)) return '';

  switch (field) {
    case 'ownerDocument': {
      const digits = cleaned.replace(/\D/g, '');
      return digits.length === 11 || digits.length === 14 ? digits : '';
    }
    case 'engineCount': {
      const match = cleaned.match(/\b([1-9])\b/);
      return match?.[1] || '';
    }
    case 'expirationDate':
    case 'issueDate': {
      const match = cleaned.match(/\b\d{2}[\/.-]\d{2}[\/.-]\d{2,4}\b/);
      return match?.[0] || '';
    }
    case 'length': {
      const match = cleaned.match(/\b\d{1,2}(?:[.,]\d{1,2})?\b/);
      return match?.[0] || '';
    }
    case 'ownerName': {
      const uppercaseNameMatch = cleaned.match(/[A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ]{2,}(?:\s+[A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ]{2,}){1,5}/);
      if (uppercaseNameMatch) return uppercaseNameMatch[0].trim();
      return /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/.test(cleaned) ? cleaned : '';
    }
    case 'propulsionType': {
      const normalized = normalizeComparableText(cleaned);
      if (normalized.includes('motor')) return 'Motor';
      if (normalized.includes('vela')) return 'Vela';
      if (normalized.includes('remo')) return 'Remo';
      if (normalized.includes('hidrojato')) return 'Hidrojato';
      if (normalized.includes('eletric')) return 'Elétrico';
      return '';
    }
    case 'vesselType': {
      const match = cleaned.match(/\b(lancha|barco|veleiro|bote|canoa|jet ski|jet|moto aqu[aá]tica|motoaquatica|pesca)\b/i);
      if (!match) return '';

      const vesselType = match[1].trim();
      if (/^jet$/i.test(vesselType)) return 'Jet';
      return vesselType.charAt(0).toUpperCase() + vesselType.slice(1);
    }
    case 'navigationArea': {
      const normalized = normalizeComparableText(cleaned);
      if (normalized.includes('navegacao interior') || normalized.includes('navegação interior')) return 'Navegação Interior';
      if (normalized.includes('interior')) return 'Interior';
      if (normalized.includes('abrigada')) return 'Abrigada';
      if (normalized.includes('costeira')) return 'Costeira';
      if (normalized.includes('mar aberto')) return 'Mar aberto';
      if (normalized.includes('lagoa')) return 'Lagoa';
      if (normalized.includes('baia') || normalized.includes('baía')) return 'Baía';
      if (normalized.includes('rio')) return 'Rio';
      return '';
    }
    case 'registrationNumber':
      return cleaned.match(/\b\d{3}[A-Z]\d{7,}\b/i)?.[0] || '';
    case 'hullNumber':
      return cleaned.match(/\b[A-Z0-9-]{4,}\b/i)?.[0] || '';
    case 'vesselName': {
      const normalized = normalizeComparableText(cleaned);
      if (normalized.includes('pvc') || normalized.includes('tie em pvc')) return '';
      if (['yamaha', 'mercury', 'honda', 'tohatsu', 'evinrude', 'johnson'].includes(normalized)) return '';

      const compactName = cleaned
        .split(/FABRICANTE|ATIVIDADE|AREA DE NAVEGACAO|ÁREA DE NAVEGAÇÃO|CPF\/CNPJ|N[º°] DO CASCO|HULL NUMBER/i)[0]
        .replace(/\|/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      return compactName.length >= 3 ? compactName : '';
    }
    default:
      return cleaned;
  }
}

function inferMarineFieldsFromTopBlock(text: string): MarineDocumentFields {
  const firstMarkerIndex = text.search(/AEE,\s*REPUBLICA FEDERATIVA DO BRASIL|REP[ÚU]BLICA FEDERATIVA DO BRASIL/i);
  const topBlock = firstMarkerIndex > 0 ? text.slice(0, firstMarkerIndex) : text;
  const lines = topBlock
    .split('\n')
    .map((line) => stripNoise(line))
    .filter((line) => line && !/^[*%\s-]+$/.test(line));

  const registrationIndex = lines.findIndex((line) => /\b\d{3}[A-Z]\d{7,}\b/i.test(line));
  const ownerDocumentIndex = lines.findIndex((line) => {
    const digits = line.replace(/\D/g, '');
    return digits.length === 11 || digits.length === 14;
  });
  const hullLine = lines.find((line) => /^\d{4,}\s+[A-Za-zÀ-ÿ]/.test(line));

  const knownPropulsions = ['Motor', 'Vela', 'Remo', 'Hidrojato', 'Elétrico'];
  const knownVesselTypes = ['Bote', 'Lancha', 'Barco', 'Veleiro', 'Canoa', 'Jet Ski', 'Jet', 'Moto Aquática'];
  const knownAreas = ['Navegação Interior', 'Interior', 'Abrigada', 'Costeira', 'Mar aberto', 'Rio', 'Lagoa', 'Baía'];

  const registrationLine = registrationIndex >= 0 ? lines[registrationIndex] : '';
  const blockAfterRegistration = registrationIndex >= 0 ? lines.slice(registrationIndex + 1, registrationIndex + 18) : [];

  const vesselNameLine =
    blockAfterRegistration.find((line) => /^[A-Z0-9][A-Z0-9\s-]{2,}$/.test(line) && !knownPropulsions.includes(line) && !knownVesselTypes.includes(line) && !['YAMAHA', 'MERCURY', 'HONDA', 'TOHATSU', 'POTMAX30HP', 'PESCA', 'NÃO'].includes(line)) || '';

  const ownerDocumentLine = ownerDocumentIndex >= 0 ? lines[ownerDocumentIndex] : '';
  const ownerNameLine = ownerDocumentIndex > 0 ? lines[ownerDocumentIndex - 1] : '';
  const expirationLine = blockAfterRegistration.find((line) => /\b\d{2}[\/.-]\d{2}[\/.-]\d{4}\b/.test(line)) || '';
  const issueDateLine =
    lines
      .slice()
      .reverse()
      .find((line) => /\b\d{2}[\/.-]\d{2}[\/.-]\d{4}\b/.test(line)) || '';

  return {
    registrationNumber: sanitizeMarineField('registrationNumber', registrationLine),
    propulsionType: sanitizeMarineField(
      'propulsionType',
      blockAfterRegistration.find((line) => knownPropulsions.some((term) => normalizeComparableText(line) === normalizeComparableText(term))) || ''
    ),
    vesselType: sanitizeMarineField(
      'vesselType',
      blockAfterRegistration.find((line) => knownVesselTypes.some((term) => normalizeComparableText(line) === normalizeComparableText(term))) || ''
    ),
    engineCount: sanitizeMarineField(
      'engineCount',
      blockAfterRegistration.find((line) => /^[1-4]$/.test(line)) || ''
    ),
    expirationDate: sanitizeMarineField('expirationDate', expirationLine),
    vesselName: sanitizeMarineField('vesselName', vesselNameLine),
    navigationArea: sanitizeMarineField(
      'navigationArea',
      blockAfterRegistration.find((line) => knownAreas.some((term) => normalizeComparableText(line).includes(normalizeComparableText(term)))) || ''
    ),
    length: sanitizeMarineField(
      'length',
      blockAfterRegistration.find((line) => /\b\d{1,2}[.,]\d{1,2}\b/.test(line)) || ''
    ),
    hullNumber: sanitizeMarineField('hullNumber', hullLine?.split(/\s+/)[0] || ''),
    ownerName: sanitizeMarineField('ownerName', ownerNameLine),
    ownerDocument: sanitizeMarineField('ownerDocument', ownerDocumentLine),
    issueDate: sanitizeMarineField('issueDate', issueDateLine),
  };
}

function parseMarineFields(text: string): MarineDocumentFields {
  const parsedByLabels: MarineDocumentFields = {
    registrationNumber: sanitizeMarineField(
      'registrationNumber',
      parseFieldNextLine(text, ['NUMERO DE INSCRICAO', 'NÚMERO DE INSCRIÇÃO', 'REGISTRATION NUMBER']) ||
        parseField(text, ['NUMERO DE INSCRICAO', 'NÚMERO DE INSCRIÇÃO', 'REGISTRATION NUMBER']) ||
        matchPatterns(text, [/\b\d{3}[A-Z]\d{7,}\b/i])
    ),
    vesselName: sanitizeMarineField(
      'vesselName',
      parseFieldNextLine(text, ['NOME DA EMBARCACAO', 'NOME DA EMBARCAÇÃO', 'NAME OF VESSEL']) ||
        parseField(text, ['NOME DA EMBARCACAO', 'NOME DA EMBARCAÇÃO', 'NAME OF VESSEL']) ||
        matchPatterns(text, [
          /NOME DA EMBARCA(?:CAO|ÇÃO)[^\n]*\n\|?\s*[A-Z0-9][A-Z0-9\s-]{2,}\s*\|?\n\|?\s*([A-Z0-9][A-Z0-9\s-]{2,})/i,
          /NOME DA EMBARCA(?:CAO|ÇÃO)[^\n]*\n([^\n]{2,60})/i,
          /NAME OF VESSEL[^\n]*\n([^\n]{2,60})/i,
        ])
    ),
    vesselType: sanitizeMarineField(
      'vesselType',
      parseFieldNextLine(text, ['TIPO DA EMBARCACAO', 'TIPO DA EMBARCAÇÃO', 'TYPE OF VESSEL']) ||
        parseField(text, ['TIPO DA EMBARCACAO', 'TIPO DA EMBARCAÇÃO', 'TYPE OF VESSEL']) ||
        matchPatterns(text, [
          /TIPO DA EMBARCA(?:CAO|ÇÃO)[^\n]*\n([^\n]{2,60})/i,
          /TYPE OF VESSEL[^\n]*\n([^\n]{2,60})/i,
        ])
    ),
    expirationDate: sanitizeMarineField(
      'expirationDate',
      parseFieldNextLine(text, ['DATA DE VALIDADE', 'EXPIRATION DATE']) ||
        parseField(text, ['DATA DE VALIDADE', 'EXPIRATION DATE']) ||
        matchPatterns(text, [/DATA DE VALIDADE[^\n]*\n([^\n]{2,30})/i, /EXPIRATION DATE[^\n]*\n([^\n]{2,30})/i])
    ),
    ownerName: sanitizeMarineField(
      'ownerName',
      parseField(text, ['PROPRIETARIO', 'PROPRIETÁRIO', 'OWNER']) ||
        matchPatterns(text, [/NOME[:\s|]*([A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ ]{5,})/i])
    ),
    ownerDocument: sanitizeMarineField(
      'ownerDocument',
      parseField(text, ['CPF/CNPJ']) || matchPatterns(text, [/CPF\/CNPJ[:\s|]*([\d.\-\/]{11,18})/i])
    ),
    propulsionType: sanitizeMarineField(
      'propulsionType',
      parseFieldNextLine(text, ['TIPO DE PROPULSAO', 'TIPO DE PROPULSÃO', 'TYPE OF PROPULSION']) ||
        parseField(text, ['TIPO DE PROPULSAO', 'TIPO DE PROPULSÃO', 'TYPE OF PROPULSION']) ||
        matchPatterns(text, [
          /TIPO DE PROPULS(?:AO|ÃO)[^\n]*\n([^\n]{2,40})/i,
          /TYPE OF PROPULSION[^\n]*\n([^\n]{2,40})/i,
        ])
    ),
    engineCount: sanitizeMarineField(
      'engineCount',
      parseFieldNextLine(text, ['QUANTIDADE DE MOTORES', 'QUANTITY OF ENGINES']) ||
        parseField(text, ['QUANTIDADE DE MOTORES', 'QUANTITY OF ENGINES']) ||
        matchPatterns(text, [
          /QUANTIDADE DE MOTORES[^\n]*\n([^\n]{1,20})/i,
          /QUANTITY OF ENGINES[^\n]*\n([^\n]{1,20})/i,
        ])
    ),
    navigationArea: sanitizeMarineField(
      'navigationArea',
      parseFieldNextLine(text, ['AREA DE NAVEGACAO', 'ÁREA DE NAVEGAÇÃO', 'NAVIGATION AREA']) ||
        parseField(text, ['AREA DE NAVEGACAO', 'ÁREA DE NAVEGAÇÃO', 'NAVIGATION AREA']) ||
        matchPatterns(text, [
          /AREA DE NAVEGACAO[^\n]*\n([^\n]{2,60})/i,
          /ÁREA DE NAVEGAÇÃO[^\n]*\n([^\n]{2,60})/i,
          /NAVIGATION AREA[^\n]*\n([^\n]{2,60})/i,
        ])
    ),
    length: sanitizeMarineField(
      'length',
      parseFieldNextLine(text, ['COMPRIMENTO', 'LENGTH']) ||
        parseField(text, ['COMPRIMENTO', 'LENGTH']) ||
        matchPatterns(text, [/COMPRIMENTO[^\n]*\n([^\n]{1,20})/i, /LENGTH[^\n]*\n([^\n]{1,20})/i])
    ),
    hullNumber: sanitizeMarineField(
      'hullNumber',
      parseFieldNextLine(text, ['Nº DO CASCO', 'N° DO CASCO', 'HULL NUMBER']) ||
        parseField(text, ['Nº DO CASCO', 'N° DO CASCO', 'HULL NUMBER']) ||
        matchPatterns(text, [/HULL NUMBER[^\n]*\n([^\n]{2,30})/i, /N[º°] DO CASCO[^\n]*\n([^\n]{2,30})/i])
    ),
    issueDate: sanitizeMarineField(
      'issueDate',
      parseFieldNextLine(text, ['DATA DE EMISSAO', 'DATA DE EMISSÃO', 'DATE OF ISSUE']) ||
        parseField(text, ['DATA DE EMISSAO', 'DATA DE EMISSÃO', 'DATE OF ISSUE']) ||
        matchPatterns(text, [/DATA DE EMISS(?:AO|ÃO)[^\n]*\n([^\n]{2,30})/i, /DATE OF ISSUE[^\n]*\n([^\n]{2,30})/i])
    ),
  };

  return mergeMarineFields(parsedByLabels, inferMarineFieldsFromTopBlock(text));
}

function mergeMarineFields(...fieldsList: MarineDocumentFields[]) {
  const merged: MarineDocumentFields = {};

  fieldsList.forEach((fields) => {
    (Object.entries(fields) as Array<[keyof MarineDocumentFields, string | undefined]>).forEach(([key, value]) => {
      if (!merged[key] && value?.trim()) {
        merged[key] = value.trim();
      }
    });
  });

  return merged;
}

async function tryDecodeQr(previewUrl: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Falha ao abrir imagem para QR.'));
    nextImage.src = previewUrl;
  });

  try {
    const { BrowserQRCodeReader } = await import('@zxing/browser');
    const reader = new BrowserQRCodeReader();
    const directResult = await reader.decodeFromImageElement(image);

    if (directResult?.getText?.().trim()) {
      return directResult.getText().trim();
    }
  } catch {
    // fallback below
  }

  try {
    const { default: jsQR } = await import('jsqr');
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return '';

    context.drawImage(image, 0, 0);

    const attempts = [
      { x: 0, y: 0, width: canvas.width, height: canvas.height },
      {
        x: Math.floor(canvas.width * 0.55),
        y: Math.floor(canvas.height * 0.35),
        width: Math.floor(canvas.width * 0.4),
        height: Math.floor(canvas.height * 0.5),
      },
    ];

    for (const attempt of attempts) {
      const imageData = context.getImageData(attempt.x, attempt.y, attempt.width, attempt.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (decoded?.data?.trim()) {
        return decoded.data.trim();
      }
    }

    return '';
  } catch {
    return '';
  }
}

function buildMarineWarning(text: string, parsedFields: MarineDocumentFields, qrText: string) {
  if (qrText) {
    return '';
  }

  const populatedValues = Object.values(parsedFields).filter((value) => value && value.trim().length > 0);
  const normalized = normalizeComparableText(text);
  const looksLikeTemplate =
    normalized.includes('titulo de inscricao de embarcacao') ||
    normalized.includes('documento da embarcacao') ||
    normalized.includes('registration number') ||
    normalized.includes('type of vessel');

  if (populatedValues.length >= 2) {
    return '';
  }

  if (looksLikeTemplate) {
    return 'O arquivo anexado parece trazer a capa QR ou o formulário reduzido do TIE, sem dados legíveis suficientes para autopreenchimento confiável.';
  }

  return 'Não encontrei dados confiáveis para preencher esse TIE automaticamente. Envie uma imagem mais aproximada da parte preenchida do documento.';
}

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

async function renderImageToPreview(file: File): Promise<RenderedDocumentPreview> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('Nao foi possivel carregar a imagem anexada.'));
      nextImage.src = objectUrl;
    });

    const maxWidth = 2200;
    const scale = Math.min(1, maxWidth / image.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Nao foi possivel preparar o canvas da imagem.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      sourceUrl: objectUrl,
      previewUrl: canvas.toDataURL('image/png'),
      pdfText: '',
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function groupPdfTextLines(items: Array<{ str?: string; transform?: number[] }>) {
  const lines: Array<{ y: number; items: Array<{ x: number; text: string }> }> = [];

  items.forEach((item) => {
    const text = typeof item.str === 'string' ? item.str.trim() : '';
    if (!text) return;

    const x = Array.isArray(item.transform) ? Number(item.transform[4] || 0) : 0;
    const y = Array.isArray(item.transform) ? Number(item.transform[5] || 0) : 0;
    const existingLine = lines.find((line) => Math.abs(line.y - y) <= 3);

    if (existingLine) {
      existingLine.items.push({ x, text });
      return;
    }

    lines.push({
      y,
      items: [{ x, text }],
    });
  });

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) =>
      line.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

async function extractPdfText(pdf: { numPages: number; getPage: (pageNumber: number) => Promise<any> }) {
  const pagesText: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageLines = groupPdfTextLines(textContent.items as Array<{ str?: string; transform?: number[] }>);
    const pageText = pageLines.join('\n');

    if (pageText.trim()) {
      pagesText.push(pageText);
    }
  }

  return normalizeOcrText(pagesText.join('\n'));
}

async function importPdfJs() {
  return import('pdfjs-dist/legacy/webpack.mjs');
}

async function renderPdfToPreview(file: File): Promise<RenderedDocumentPreview> {
  const sourceUrl = URL.createObjectURL(file);
  const pdfjs = await importPdfJs();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pdfText = await extractPdfText(pdf);
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Nao foi possivel preparar o canvas do PDF.');
  }

  await page.render({ canvasContext: context, viewport }).promise;
  return {
    sourceUrl,
    previewUrl: canvas.toDataURL('image/png'),
    pdfText,
  };
}

async function runOcr(previewUrl: string, onProgress?: (progress: number) => void) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['por', 'eng'], 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(Math.round((message.progress || 0) * 100));
      }
    },
  });

  try {
    const result = await worker.recognize(previewUrl);
    return {
      text: normalizeOcrText(result.data.text || ''),
      confidence: Number.isFinite(result.data.confidence) ? result.data.confidence : 0,
    };
  } finally {
    await worker.terminate();
  }
}

export async function extractDocumentInsight(
  file: File,
  productTitle: string,
  onProgress?: (progress: number) => void
): Promise<{ sourceUrl: string; insight: DocumentInsight }> {
  const rendered = isPdfFile(file) ? await renderPdfToPreview(file) : await renderImageToPreview(file);

  try {
    const ocr = await runOcr(rendered.previewUrl, onProgress);
    const isMarineDocument = /tie|tiem|embarca|barco|vessel|pesca/i.test(productTitle);
    const qrText = isMarineDocument ? await tryDecodeQr(rendered.previewUrl) : '';
    const pdfText = rendered.pdfText || '';
    const combinedText = normalizeOcrText([pdfText, ocr.text].filter(Boolean).join('\n'));
    const parsedFields = isMarineDocument
      ? mergeMarineFields(
          qrText ? parseMarineFields(qrText) : {},
          pdfText ? parseMarineFields(pdfText) : {},
          parseMarineFields(ocr.text)
        )
      : {};

    return {
      sourceUrl: rendered.sourceUrl,
      insight: {
        previewUrl: rendered.previewUrl,
        rawText: normalizeOcrText([qrText, pdfText, ocr.text].filter(Boolean).join('\n\n')),
        confidence: ocr.confidence,
        parsedFields,
        qrText,
        warning: isMarineDocument ? buildMarineWarning(combinedText, parsedFields, qrText) : '',
      },
    };
  } catch (error) {
    return {
      sourceUrl: rendered.sourceUrl,
      insight: {
        previewUrl: rendered.previewUrl,
        rawText: '',
        confidence: 0,
        parsedFields: {},
        qrText: '',
        warning: '',
      },
    };
  }
}
