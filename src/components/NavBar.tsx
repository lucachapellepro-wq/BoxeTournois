"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function NavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "active" : "";
  };

  return (
    <nav>
      <Link href="/" className={isActive("/")}>
        Tournoi
      </Link>
      <Link href="/tireurs" className={isActive("/tireurs")}>
        Tireurs
      </Link>
      <Link href="/clubs" className={isActive("/clubs")}>
        Clubs
      </Link>
    </nav>
  );
}
