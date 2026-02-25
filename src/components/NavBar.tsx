"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/** Barre de navigation principale avec menu hamburger mobile */
export function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isActive = (path: string) => {
    return pathname === path ? "active" : "";
  };

  // Close menu on outside tap (mobile)
  useEffect(() => {
    if (!isOpen) return;
    const handleTap = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        navRef.current && !navRef.current.contains(target) &&
        toggleRef.current && !toggleRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("touchstart", handleTap);
    document.addEventListener("mousedown", handleTap);
    return () => {
      document.removeEventListener("touchstart", handleTap);
      document.removeEventListener("mousedown", handleTap);
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        ref={toggleRef}
        className="nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        {isOpen ? "✕" : "☰"}
      </button>
      <nav ref={navRef} className={isOpen ? "nav-mobile-open" : ""}>
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
