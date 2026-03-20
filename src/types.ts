export type UserRole = 'client' | 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: any;
}

export interface ServiceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'insurance' | 'license' | 'bureaucracy';
  requiredDocuments: string[];
  image: string;
}
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'insurance' | 'license' | 'bureaucracy';
  requiredDocuments: string[];
  requiredFiles?: string[]; // Arquivos necessários (ex: ['PDF', 'JPG', 'PNG'])
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends ServiceProduct {
  cartId: string;
  uploadedDocs: Record<string, File | null>;
}

export interface DocumentMetadata {
  url: string;
  fullName: string;
  uploadedAt: string;
  fileName: string;
}

export interface OrderItem extends ServiceProduct {
  cartId: string;
  uploadedDocs: Record<string, string | DocumentMetadata>;
  requiredFiles?: string[]; // Tipos de arquivo aceitos
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  items: OrderItem[];
  total: number;
  status: 'pending_docs' | 'pending_payment' | 'processing' | 'paid' | 'completed' | 'rejected' | 'failed';
  date: string;
  payment?: {
    method?: 'pix' | 'whatsapp' | 'card' | 'manual';
    status?: 'pending_payment' | 'paid' | 'failed' | 'refunded';
    pixKey?: string;
    pixPayload?: string;
    whatsappMessage?: string;
    createdAt?: string;
    paidAt?: string;
    transactionId?: string;
  };
}

// Layout Editor Types
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export type LayerType = 'text' | 'shape' | 'image' | 'button';

export interface Layer {
  id: string;
  type: LayerType;
  label: string;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: RGBColor;
  fontWeight?: 'normal' | 'bold' | '600' | '700';
  textAlign?: 'left' | 'center' | 'right';
  // Background
  backgroundColor?: RGBColor;
  borderColor?: RGBColor;
  borderWidth?: number;
  borderRadius?: number;
  // Image
  imageUrl?: string;
}

export interface HomePageHeroSettings {
  backgroundImageUrl: string;
  badgeText: string;
  titlePrefix: string;
  titlePrimaryHighlight: string;
  titleMiddle: string;
  titleSecondaryHighlight: string;
  titleSuffix: string;
  description: string;
  primaryButtonText: string;
  primaryButtonHref: string;
  secondaryButtonText: string;
  secondaryButtonHref: string;
}

export interface HomePageServicesSettings {
  eyebrowText: string;
  title: string;
  description: string;
  highlightBadgeText: string;
  detailsButtonText: string;
  addButtonText: string;
  priceLabel: string;
  documentsLabel: string;
  additionalDocumentsLabel: string;
}

export interface HomePageCtaSettings {
  title: string;
  description: string;
  contactLabel: string;
  phoneNumber: string;
  workingHours: string;
  buttonText: string;
  buttonHref: string;
}

export interface HomePageThemeSettings {
  pageBackground: string;
  heroOverlayFrom: string;
  heroOverlayVia: string;
  heroOverlayTo: string;
  heroAccentFrom: string;
  heroAccentTo: string;
  heroBadgeBackground: string;
  heroBadgeBorder: string;
  heroBadgeText: string;
  heroTitleText: string;
  heroDescriptionText: string;
  heroPrimaryButtonFrom: string;
  heroPrimaryButtonTo: string;
  heroPrimaryButtonText: string;
  heroSecondaryButtonBackground: string;
  heroSecondaryButtonBorder: string;
  heroSecondaryButtonText: string;
  sectionGlowTop: string;
  sectionGlowBottom: string;
  sectionEyebrowText: string;
  sectionTitleText: string;
  sectionDividerFrom: string;
  sectionDividerTo: string;
  sectionDescriptionText: string;
  sliderControlBackground: string;
  sliderControlBorder: string;
  sliderControlIcon: string;
  sliderDotActive: string;
  sliderDotInactive: string;
  cardBackground: string;
  cardBorder: string;
  cardImageOverlay: string;
  cardBadgeBackground: string;
  cardBadgeText: string;
  cardTitleText: string;
  cardDescriptionText: string;
  cardMetaText: string;
  cardPriceText: string;
  cardDocsPanelBackground: string;
  cardDocsPanelBorder: string;
  cardDocsPanelText: string;
  cardDocsPanelAccent: string;
  cardSecondaryButtonBackground: string;
  cardSecondaryButtonBorder: string;
  cardSecondaryButtonText: string;
  cardPrimaryButtonFrom: string;
  cardPrimaryButtonTo: string;
  cardPrimaryButtonText: string;
  ctaGlow: string;
  ctaTitleText: string;
  ctaDescriptionText: string;
  ctaContactBackground: string;
  ctaContactBorder: string;
  ctaContactLabelText: string;
  ctaPhoneText: string;
  ctaHoursText: string;
  ctaButtonFrom: string;
  ctaButtonTo: string;
  ctaButtonText: string;
}

export interface HomePageTypographySettings {
  heroBadgeSize: number;
  heroTitleMobile: number;
  heroTitleDesktop: number;
  heroDescriptionSize: number;
  heroButtonSize: number;
  sectionEyebrowSize: number;
  sectionTitleMobile: number;
  sectionTitleDesktop: number;
  sectionDescriptionSize: number;
  cardBadgeSize: number;
  cardTitleSize: number;
  cardDescriptionSize: number;
  cardMetaSize: number;
  cardPriceSize: number;
  cardButtonSize: number;
  ctaTitleMobile: number;
  ctaTitleDesktop: number;
  ctaDescriptionSize: number;
  ctaContactLabelSize: number;
  ctaPhoneSize: number;
  ctaHoursSize: number;
  ctaButtonSize: number;
}

export interface HomePageLayoutSettings {
  hero: HomePageHeroSettings;
  services: HomePageServicesSettings;
  cta: HomePageCtaSettings;
  theme: HomePageThemeSettings;
  typography: HomePageTypographySettings;
}

export interface LayoutEditConfig {
  id: string;
  name: string;
  description: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: RGBColor;
  layers: Layer[];
  homepage: HomePageLayoutSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
