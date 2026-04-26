"use client";
import { DEFAULT_SERVICES } from '@/lib/defaultServices';
import { ProductCatalogPage } from '@/components/ProductCatalogPage';

export default function ServicesPage() {
  return (
    <ProductCatalogPage
      segment="nautica"
      eyebrow="🎯 Catálogo Completo"
      title="Serviços Profissionais"
      description="Todos os documentos e regularizações necessárias para sua embarcação. Serviços especializados com expertise de 20+ anos."
      fallbackProducts={DEFAULT_SERVICES}
      cartNounSingular="serviço"
      cartNounPlural="serviços"
    />
  );
}
