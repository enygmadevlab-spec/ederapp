import type { MetadataRoute } from 'next';
import {
  APP_BACKGROUND_COLOR,
  APP_DESCRIPTION,
  APP_DISPLAY,
  APP_NAME,
  APP_SCOPE,
  APP_SHORT_NAME,
  APP_START_URL,
  APP_THEME_COLOR,
} from '@/lib/appConfig';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: APP_START_URL,
    scope: APP_SCOPE,
    display: APP_DISPLAY,
    background_color: APP_BACKGROUND_COLOR,
    theme_color: APP_THEME_COLOR,
    orientation: 'portrait',
    icons: [
      {
        src: '/eder.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
    ],
  };
}
