import { BusinessSegment, Product, ProductCategory, ServiceProduct } from '@/types';

export const BUSINESS_COLLECTIONS: Record<BusinessSegment, string> = {
  nautica: 'products',
  docs: 'docsProducts',
};

export const BUSINESS_ROUTES: Record<BusinessSegment, string> = {
  nautica: '/services',
  docs: '/docs-cards',
};

export const BUSINESS_NAMES: Record<BusinessSegment, string> = {
  nautica: 'Despachante Náutico',
  docs: 'Docs PVC',
};

export const BUSINESS_SUMMARIES: Record<BusinessSegment, string> = {
  nautica: 'Regularizações, seguros e processos para embarcações com o fluxo já existente do app.',
  docs: 'Cartões, credenciais e documentos em PVC com catálogo, carrinho e administração próprios.',
};

export const BUSINESS_IMAGES: Record<BusinessSegment, string> = {
  nautica: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=1200',
  docs: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1200',
};

const LEGACY_NAUTICA_IMAGES = new Set([
  'https://images.unsplash.com/photo-1564419434663-c49967363849?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1534951475654-20a22eb28dfb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1605281317010-fe5ffe79b9b7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=800',
]);

function resolveNauticaImageByTitle(title: string, currentImage?: string | null) {
  if (currentImage && !LEGACY_NAUTICA_IMAGES.has(currentImage)) {
    return currentImage;
  }

  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('seguro') || normalizedTitle.includes('dpem')) {
    return 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&q=80&w=1200';
  }

  if (normalizedTitle.includes('pescador profissional')) {
    return 'https://images.unsplash.com/photo-1494412685616-a5d310fbb07d?auto=format&fit=crop&q=80&w=1200';
  }

  if (normalizedTitle.includes('pescador amador') || normalizedTitle.includes('esportivo')) {
    return 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&q=80&w=1200';
  }

  if (normalizedTitle.includes('transfer')) {
    return 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200';
  }

  if (normalizedTitle.includes('inscri') || normalizedTitle.includes('embarcação nova') || normalizedTitle.includes('embarcacao nova')) {
    return 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=1200';
  }

  return currentImage || BUSINESS_IMAGES.nautica;
}

function resolveBusinessImage(
  title: string,
  image: string | undefined | null,
  segment: BusinessSegment
) {
  if (segment === 'nautica') {
    return resolveNauticaImageByTitle(title, image);
  }

  return image || BUSINESS_IMAGES[segment];
}

function normalizeDocsPresetDetails(
  title: string,
  description: string,
  requiredDocuments: string[]
) {
  const titleKey = normalizeTitleKey(title);

  if (titleKey === 'cnh em cartao pvc') {
    const normalizedDescription = description.trim();
    const oldDescription =
      'Versão compacta em PVC baseada no documento oficial para organização pessoal e apresentação rápida no dia a dia.';
    const nextDescription =
      'Versão compacta em PVC produzida a partir da CNH oficial em PDF ou imagem com QR Code, para organização pessoal e apresentação rápida no dia a dia.';

    const nextDocuments = requiredDocuments.map((documentLabel) =>
      documentLabel === 'CNH em PDF ou imagem' ? 'CNH em PDF ou imagem com QR Code' : documentLabel
    );

    return {
      description: !normalizedDescription || normalizedDescription === oldDescription ? nextDescription : description,
      requiredDocuments: nextDocuments,
    };
  }

  if (titleKey === 'tie em pvc') {
    const normalizedDescription = description.trim();
    const oldDescription =
      'Título de Inscrição de Embarcação em formato PVC para organização a bordo, carteira e pasta náutica.';
    const nextDescription =
      'Título de Inscrição de Embarcação em formato PVC com leitura do documento base e seleção dos dados essenciais para caber no cartão padrão.';
    const nextDocuments = [
      'TIE ou TIEM em PDF/imagem com QR Code',
      'Número de inscrição',
      'Nome da embarcação',
      'Tipo da embarcação',
      'Nome do proprietário',
      'CPF/CNPJ do proprietário',
      'Tipo de propulsão',
      'Quantidade de motores',
      'Área de navegação',
      'Data de validade',
    ];

    return {
      description: !normalizedDescription || normalizedDescription === oldDescription ? nextDescription : description,
      requiredDocuments: nextDocuments,
    };
  }

  return {
    description,
    requiredDocuments,
  };
}

function normalizeTitleKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeBusinessSegment(value?: string | null): BusinessSegment {
  return value === 'docs' ? 'docs' : 'nautica';
}

export function normalizeProductCategory(value?: string | null): ProductCategory {
  if (value === 'insurance' || value === 'license' || value === 'bureaucracy') {
    return value;
  }

  return 'bureaucracy';
}

export function getCategoryLabel(
  category: ProductCategory,
  segment: BusinessSegment = 'nautica'
): string {
  if (segment === 'docs') {
    switch (category) {
      case 'insurance':
        return 'Credencial';
      case 'license':
        return 'Carteira';
      default:
        return 'Documento';
    }
  }

  switch (category) {
    case 'insurance':
      return 'Seguro';
    case 'license':
      return 'Licença';
    default:
      return 'Documentação';
  }
}

export function getCategoryBadgeText(
  category: ProductCategory,
  segment: BusinessSegment = 'nautica'
): string {
  if (segment === 'docs') {
    switch (category) {
      case 'insurance':
        return '🪪 Credencial';
      case 'license':
        return '💳 Carteira';
      default:
        return '📄 Documento';
    }
  }

  switch (category) {
    case 'insurance':
      return '🛡️ Seguro';
    case 'license':
      return '📜 Licença';
    default:
      return '📝 Documentação';
  }
}

export function getSegmentLabel(segment?: string | null): string {
  return normalizeBusinessSegment(segment) === 'docs' ? 'Docs PVC' : 'Náutica';
}

export function getCategoryOptions(segment: BusinessSegment) {
  if (segment === 'docs') {
    return [
      { value: 'license' as const, label: 'Carteira' },
      { value: 'bureaucracy' as const, label: 'Documento' },
      { value: 'insurance' as const, label: 'Credencial' },
    ];
  }

  return [
    { value: 'insurance' as const, label: 'Seguro' },
    { value: 'license' as const, label: 'Licença' },
    { value: 'bureaucracy' as const, label: 'Documentação' },
  ];
}

export function normalizeServiceProduct(
  product: Partial<ServiceProduct> & { id: string },
  fallbackSegment: BusinessSegment
): ServiceProduct {
  const businessSegment = normalizeBusinessSegment(product.businessSegment ?? fallbackSegment);
  const title = product.title ?? '';
  const docsPresetDetails = normalizeDocsPresetDetails(
    title,
    product.description ?? '',
    Array.isArray(product.requiredDocuments) ? product.requiredDocuments : []
  );

  return {
    id: product.id,
    title,
    description: docsPresetDetails.description,
    price: typeof product.price === 'number' ? product.price : Number(product.price ?? 0),
    category: normalizeProductCategory(product.category),
    requiredDocuments: docsPresetDetails.requiredDocuments,
    image: resolveBusinessImage(title, product.image, businessSegment),
    businessSegment,
  };
}

export function normalizeProductRecord(
  product: Partial<Product> & { id: string },
  fallbackSegment: BusinessSegment
): Product {
  const businessSegment = normalizeBusinessSegment(product.businessSegment ?? fallbackSegment);
  const title = product.title ?? '';
  const docsPresetDetails = normalizeDocsPresetDetails(
    title,
    product.description ?? '',
    Array.isArray(product.requiredDocuments) ? product.requiredDocuments : []
  );

  return {
    id: product.id,
    title,
    description: docsPresetDetails.description,
    price: typeof product.price === 'number' ? product.price : Number(product.price ?? 0),
    category: normalizeProductCategory(product.category),
    requiredDocuments: docsPresetDetails.requiredDocuments,
    requiredFiles: Array.isArray(product.requiredFiles) ? product.requiredFiles : [],
    image: resolveBusinessImage(title, product.image, businessSegment),
    createdAt: typeof product.createdAt === 'string' ? product.createdAt : undefined,
    updatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : undefined,
    businessSegment,
  };
}
