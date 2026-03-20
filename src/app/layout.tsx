import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eder Martins Assessoria Náutica",
  description: "Assessoria especializada em regularização náutica. Serviços de documentação, licenciamento e burocracia para embarcações.",
  keywords: "assessoria náutica, regularização, documentação, licenciamento, barcos, embarcações",
  authors: [{ name: "Eder Martins" }],
  creator: "Eder Martins",
  publisher: "Eder Martins Assessoria Náutica",
  icons: {
    icon: "/eder.ico",
    shortcut: "/eder.ico",
    apple: "/eder.ico",
  },
};

import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Layout } from '../components/Layout';
import { FirestoreInitializer } from '../components/FirestoreInitializer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FirestoreInitializer />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Layout>
                {children}
              </Layout>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
