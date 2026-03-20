import { HomePageLayoutSettings, LayoutEditConfig, RGBColor } from '@/types';

// Cores base do visual atual
export const systemColors = {
  primary: { r: 0, g: 166, b: 225 },
  secondary: { r: 56, g: 189, b: 248 },
  background: { r: 2, g: 12, b: 27 },
  dark: { r: 15, g: 23, b: 42 },
  slate: { r: 148, g: 163, b: 184 },
  white: { r: 255, g: 255, b: 255 },
};

const defaultHomepageLayout: HomePageLayoutSettings = {
  hero: {
    backgroundImageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&q=80&w=1920',
    badgeText: 'Assessoria Especializada em Náutica',
    titlePrefix: 'Navegue com',
    titlePrimaryHighlight: 'Segurança',
    titleMiddle: 'e',
    titleSecondaryHighlight: 'Legalidade',
    titleSuffix: '.',
    description: 'Especialistas em documentação náutica com 20+ anos de experiência. Seguro DPEM, licenças de pesca, regularização completa junto à Marinha.',
    primaryButtonText: 'Ver Serviços Online',
    primaryButtonHref: '/services',
    secondaryButtonText: 'Área do Cliente',
    secondaryButtonHref: '/login',
  },
  services: {
    eyebrowText: 'Catálogo Premium',
    title: 'Nossas Soluções Exclusivas',
    description: 'Deslize para explorar nossos serviços. Tecnologia, agilidade e excelência na documentação náutica.',
    highlightBadgeText: 'Destaque',
    detailsButtonText: 'Detalhes',
    addButtonText: 'Adicionar',
    priceLabel: 'Investimento',
    documentsLabel: 'Documentos',
    additionalDocumentsLabel: 'documentos adicionais',
  },
  cta: {
    title: 'Pronto para Regularizar?',
    description: 'Envie sua documentação agora mesmo pelo nosso sistema seguro e 100% online. Resposta em até 48 horas!',
    contactLabel: 'Dúvidas? Fale conosco no WhatsApp',
    phoneNumber: '(48) 99624-1068',
    workingHours: 'Atendimento de seg-sex, 09:00-18:00',
    buttonText: 'Iniciar Atendimento Agora',
    buttonHref: '/services',
  },
  theme: {
    pageBackground: '#020c1b',
    heroOverlayFrom: 'rgba(2, 12, 27, 0.40)',
    heroOverlayVia: 'rgba(2, 12, 27, 0.70)',
    heroOverlayTo: '#020c1b',
    heroAccentFrom: '#7dd3fc',
    heroAccentTo: '#22d3ee',
    heroBadgeBackground: 'rgba(8, 47, 73, 0.45)',
    heroBadgeBorder: 'rgba(56, 189, 248, 0.30)',
    heroBadgeText: '#bae6fd',
    heroTitleText: '#ffffff',
    heroDescriptionText: '#e2e8f0',
    heroPrimaryButtonFrom: '#7dd3fc',
    heroPrimaryButtonTo: '#67e8f9',
    heroPrimaryButtonText: '#020c1b',
    heroSecondaryButtonBackground: 'rgba(255, 255, 255, 0.10)',
    heroSecondaryButtonBorder: 'rgba(255, 255, 255, 0.20)',
    heroSecondaryButtonText: '#ffffff',
    sectionGlowTop: 'rgba(14, 165, 233, 0.15)',
    sectionGlowBottom: 'rgba(6, 182, 212, 0.10)',
    sectionEyebrowText: '#38bdf8',
    sectionTitleText: '#ffffff',
    sectionDividerFrom: '#38bdf8',
    sectionDividerTo: '#22d3ee',
    sectionDescriptionText: '#cbd5e1',
    sliderControlBackground: 'rgba(255, 255, 255, 0.05)',
    sliderControlBorder: 'rgba(255, 255, 255, 0.10)',
    sliderControlIcon: '#ffffff',
    sliderDotActive: '#22d3ee',
    sliderDotInactive: '#475569',
    cardBackground: 'rgba(2, 12, 27, 0.40)',
    cardBorder: 'rgba(255, 255, 255, 0.10)',
    cardImageOverlay: '#020c1b',
    cardBadgeBackground: 'rgba(2, 132, 199, 0.90)',
    cardBadgeText: '#ffffff',
    cardTitleText: '#ffffff',
    cardDescriptionText: '#cbd5e1',
    cardMetaText: '#94a3b8',
    cardPriceText: '#38bdf8',
    cardDocsPanelBackground: 'rgba(30, 41, 59, 0.50)',
    cardDocsPanelBorder: 'rgba(51, 65, 85, 1)',
    cardDocsPanelText: '#94a3b8',
    cardDocsPanelAccent: '#38bdf8',
    cardSecondaryButtonBackground: 'rgba(255, 255, 255, 0.02)',
    cardSecondaryButtonBorder: 'rgba(255, 255, 255, 0.20)',
    cardSecondaryButtonText: '#ffffff',
    cardPrimaryButtonFrom: '#0284c7',
    cardPrimaryButtonTo: '#0891b2',
    cardPrimaryButtonText: '#ffffff',
    ctaGlow: 'rgba(2, 132, 199, 0.18)',
    ctaTitleText: '#ffffff',
    ctaDescriptionText: '#e2e8f0',
    ctaContactBackground: 'rgba(8, 47, 73, 0.50)',
    ctaContactBorder: 'rgba(14, 165, 233, 0.30)',
    ctaContactLabelText: '#7dd3fc',
    ctaPhoneText: '#7dd3fc',
    ctaHoursText: '#94a3b8',
    ctaButtonFrom: '#38bdf8',
    ctaButtonTo: '#22d3ee',
    ctaButtonText: '#020c1b',
  },
  typography: {
    heroBadgeSize: 12,
    heroTitleMobile: 60,
    heroTitleDesktop: 96,
    heroDescriptionSize: 22,
    heroButtonSize: 16,
    sectionEyebrowSize: 12,
    sectionTitleMobile: 40,
    sectionTitleDesktop: 60,
    sectionDescriptionSize: 20,
    cardBadgeSize: 12,
    cardTitleSize: 24,
    cardDescriptionSize: 14,
    cardMetaSize: 12,
    cardPriceSize: 30,
    cardButtonSize: 14,
    ctaTitleMobile: 38,
    ctaTitleDesktop: 52,
    ctaDescriptionSize: 20,
    ctaContactLabelSize: 13,
    ctaPhoneSize: 36,
    ctaHoursSize: 12,
    ctaButtonSize: 18,
  },
};

export function rgbToHex(color: RGBColor): string {
  const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export function hexToRgb(hex: string): RGBColor {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) {
    return systemColors.background;
  }

  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function cloneHomepageSettings(settings: HomePageLayoutSettings): HomePageLayoutSettings {
  return {
    hero: { ...settings.hero },
    services: { ...settings.services },
    cta: { ...settings.cta },
    theme: { ...settings.theme },
    typography: { ...settings.typography },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mergeHomepageSettings(rawHomepage: unknown): HomePageLayoutSettings {
  const defaults = cloneHomepageSettings(defaultHomepageLayout);

  if (!isRecord(rawHomepage)) {
    return defaults;
  }

  return {
    hero: {
      ...defaults.hero,
      ...(isRecord(rawHomepage.hero) ? rawHomepage.hero : {}),
    },
    services: {
      ...defaults.services,
      ...(isRecord(rawHomepage.services) ? rawHomepage.services : {}),
    },
    cta: {
      ...defaults.cta,
      ...(isRecord(rawHomepage.cta) ? rawHomepage.cta : {}),
    },
    theme: {
      ...defaults.theme,
      ...(isRecord(rawHomepage.theme) ? rawHomepage.theme : {}),
    },
    typography: {
      ...defaults.typography,
      ...(isRecord(rawHomepage.typography) ? rawHomepage.typography : {}),
    },
  };
}

export function createDefaultLayout(): LayoutEditConfig {
  return {
    id: 'default-layout',
    name: 'Layout Principal do Site',
    description: 'Configuração visual da página inicial',
    canvasWidth: 1440,
    canvasHeight: 2200,
    backgroundColor: systemColors.background,
    layers: [],
    homepage: cloneHomepageSettings(defaultHomepageLayout),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  };
}

export function mergeLayoutWithDefaults(layout?: Partial<LayoutEditConfig> | null): LayoutEditConfig {
  const defaults = createDefaultLayout();
  const homepage = mergeHomepageSettings(layout?.homepage);

  return {
    ...defaults,
    ...layout,
    id: layout?.id || defaults.id,
    name: layout?.name || defaults.name,
    description: layout?.description || defaults.description,
    canvasWidth: typeof layout?.canvasWidth === 'number' ? layout.canvasWidth : defaults.canvasWidth,
    canvasHeight: typeof layout?.canvasHeight === 'number' ? layout.canvasHeight : defaults.canvasHeight,
    backgroundColor: layout?.backgroundColor || hexToRgb(homepage.theme.pageBackground),
    layers: Array.isArray(layout?.layers) ? layout.layers : defaults.layers,
    homepage,
    createdAt: layout?.createdAt || defaults.createdAt,
    updatedAt: layout?.updatedAt || defaults.updatedAt,
    createdBy: layout?.createdBy || defaults.createdBy,
  };
}
