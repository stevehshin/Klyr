import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Klyr - Privacy-First Workspace",
  description: "A calm, tile-based workspace with end-to-end encryption",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Klyr",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Klyr - Privacy-First Workspace",
    description: "A calm, tile-based workspace with end-to-end encryption",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // safe-area for notched devices
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Klyr" />
        <link rel="apple-touch-icon" href="/logo.svg" />
      </head>
      <body className="antialiased min-h-screen touch-manipulation">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
