import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_THEME_COLOR,
} from '@/lib/appConfig';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: "assessoria náutica, regularização, documentação, licenciamento, barcos, embarcações, pvc, credenciais, documentos",
  authors: [{ name: "Eder Martins" }],
  creator: "Eder Martins",
  publisher: "Eder Martins Assessoria Náutica",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: 'website',
    locale: 'pt_BR',
  },
  icons: {
    icon: "/eder.ico",
    shortcut: "/eder.ico",
    apple: "/eder.ico",
  },
};

export const viewport: Viewport = {
  themeColor: APP_THEME_COLOR,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Layout } from '../components/Layout';
import { FirestoreInitializer } from '../components/FirestoreInitializer';
import { InstallAppBanner } from '../components/InstallAppBanner';
import { PwaRegistrar } from '../components/PwaRegistrar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FirestoreInitializer />
        <PwaRegistrar />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Layout>
                {children}
              </Layout>
              <InstallAppBanner />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
