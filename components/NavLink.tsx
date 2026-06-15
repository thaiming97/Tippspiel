"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigations-Link mit aktiver Markierung (animierte Pille + Gold-Linie).
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
        active ? "text-night" : "text-white/70 hover:text-white"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-gold-gradient shadow-glow-gold"
        />
      )}
      {children}
    </Link>
  );
}
