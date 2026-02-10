"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path ? "active" : "";
  };

  return (
    <>
      <button
        className="nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>
      <nav className={isOpen ? "nav-mobile-open" : ""}>
        <Link href="/" className={isActive("/")} onClick={() => setIsOpen(false)}>
          Tournoi
        </Link>
        <Link href="/tireurs" className={isActive("/tireurs")} onClick={() => setIsOpen(false)}>
          Tireurs
        </Link>
        <Link href="/clubs" className={isActive("/clubs")} onClick={() => setIsOpen(false)}>
          Clubs
        </Link>
      </nav>
    </>
  );
}
