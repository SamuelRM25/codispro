import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PWAInstall from "@/components/pwa-install";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
};

export const metadata: Metadata = {
  title: "CODISPRO - Sistema de Gestión",
  description: "Sistema integral de gestión para constructoras con control de trabajadores, herramientas, vehículos, envíos, caja chica y proyectos.",
  keywords: ["Constructora", "Gestión", "Trabajadores", "Herramientas", "Vehículos", "Proyectos", "Next.js", "TypeScript"],
  authors: [{ name: "CODISPRO" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CODISPRO",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "CODISPRO",
    description: "Sistema integral de gestión para constructoras",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground relative overflow-x-hidden min-h-screen`}
      >
        {children}
        <Toaster />
        <PWAInstall />
      </body>
    </html>
  );
}
