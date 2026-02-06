import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Tournoi Savate BF — Gestion des tireurs",
  description: "Application de gestion de tournoi de savate boxe française",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <header className="header">
          <div className="header-inner">
            <a href="/" className="logo">
              🥊 SAVATE<span>BF</span>
            </a>
            <NavBar />
          </div>
        </header>
        <main className="container page">{children}</main>
      </body>
    </html>
  );
}
