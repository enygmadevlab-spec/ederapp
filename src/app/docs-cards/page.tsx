"use client";

import { ProductCatalogPage } from '@/components/ProductCatalogPage';
import { DEFAULT_DOCS_PRODUCTS } from '@/lib/defaultDocsProducts';

export default function DocsCardsPage() {
  return (
    <ProductCatalogPage
      segment="docs"
      eyebrow="💳 Catálogo PVC"
      title="Docs Cards em PVC"
      description="Uma nova empresa dentro do mesmo app para vender documentos, carteiras e credenciais em PVC com seu próprio catálogo."
      fallbackProducts={DEFAULT_DOCS_PRODUCTS}
      cartNounSingular="documento"
      cartNounPlural="documentos"
    />
  );
}
