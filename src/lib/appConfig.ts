import { MetadataRoute } from 'next';

export const APP_NAME = 'EderApp';
export const APP_SHORT_NAME = 'EderApp';
export const APP_DESCRIPTION =
  'Plataforma profissional para serviços náuticos e documentos em PVC, com catálogo, checkout e gestão operacional.';
export const APP_THEME_COLOR = '#0c5fa5';
export const APP_BACKGROUND_COLOR = '#020c1b';
export const APP_START_URL = '/';
export const APP_DISPLAY: MetadataRoute.Manifest['display'] = 'standalone';
export const APP_SCOPE = '/';

export const APP_CONTACT = {
  phone: '(48) 99624-1068',
  whatsapp: '5548996241068',
  email: 'pescasulbrasil@gmail.com',
};

export const LOCAL_STORAGE_KEYS = {
  cart: 'eder-cart-items',
  theme: 'eder-theme-mode',
  installDismissed: 'eder-install-dismissed',
} as const;

export const IOS_INSTALL_STEPS = [
  'Abra o menu de compartilhamento do Safari.',
  'Toque em "Adicionar à Tela de Início".',
  'Confirme para instalar o app no iPhone ou iPad.',
] as const;

export const BROWSER_INSTALL_STEPS = [
  'No computador ou Android, use o botão Instalar quando ele aparecer.',
  'Se o navegador não exibir automaticamente, abra o menu do navegador e escolha "Instalar aplicativo".',
] as const;
