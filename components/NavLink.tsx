"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Reiter mit aktiver Markierung: gefüllte Lime-Pille mit Tinten-Text,
 * inaktiv dezent. Sanfter Übergang beim Wechsel.
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
      className={`relative whitespace-nowrap rounded-full px-4 py-1.5 transition-colors duration-200 ${
        active ? "text-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-lime-gradient shadow-glow"
        />
      )}
      {children}
    </Link>
  );
}
