import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppHeader from "../components/AppHeader";
import Navigation from "../components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AssetSteward - Institutional Management",
  description: "Control de inventario y auditoria geografica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-[#f3f6fb] text-slate-900`}>
        <Navigation />
        <div className="min-h-screen md:pl-72">
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-8 md:pt-6">
              <div className="mx-auto max-w-[1440px] space-y-6">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
