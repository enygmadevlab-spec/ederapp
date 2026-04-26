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

  return {
    id: product.id,
    title: product.title ?? '',
    description: product.description ?? '',
    price: typeof product.price === 'number' ? product.price : Number(product.price ?? 0),
    category: normalizeProductCategory(product.category),
    requiredDocuments: Array.isArray(product.requiredDocuments) ? product.requiredDocuments : [],
    image: product.image || BUSINESS_IMAGES[businessSegment],
    businessSegment,
  };
}

export function normalizeProductRecord(
  product: Partial<Product> & { id: string },
  fallbackSegment: BusinessSegment
): Product {
  const businessSegment = normalizeBusinessSegment(product.businessSegment ?? fallbackSegment);

  return {
    id: product.id,
    title: product.title ?? '',
    description: product.description ?? '',
    price: typeof product.price === 'number' ? product.price : Number(product.price ?? 0),
    category: normalizeProductCategory(product.category),
    requiredDocuments: Array.isArray(product.requiredDocuments) ? product.requiredDocuments : [],
    requiredFiles: Array.isArray(product.requiredFiles) ? product.requiredFiles : [],
    image: product.image || BUSINESS_IMAGES[businessSegment],
    createdAt: typeof product.createdAt === 'string' ? product.createdAt : undefined,
    updatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : undefined,
    businessSegment,
  };
}
