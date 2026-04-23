import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "nós. — Gestão Financeira",
  description: "Controle financeiro pessoal.",
  applicationName: "nós.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "nós.",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.className} suppressHydrationWarning>
      <body className="bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
