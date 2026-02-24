import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata: Metadata = {
  title: "Tournoi Savate BF — Gestion des tireurs",
  description: "Application de gestion de tournoi de savate boxe française",
};

/** Layout racine : header avec navigation, toast global et contenu principal */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <a href="#main-content" className="skip-link">Aller au contenu</a>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="logo">
              🥊 SAVATE<span>BF</span>
            </Link>
            <NavBar />
          </div>
        </header>
        <ToastProvider>
          <main id="main-content" className="container page">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
