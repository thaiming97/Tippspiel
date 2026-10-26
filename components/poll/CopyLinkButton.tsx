"use client";

import { useEffect, useRef, useState } from "react";
import { START_PASSWORD } from "@/lib/username";

/** Einladungstext zum Teilen: Titel, Link und wie die erste Anmeldung geht. */
function inviteText(title: string, url: string): string {
  return [
    `Hier ist die Abstimmung für „${title}“:`,
    url,
    "",
    `Erste Anmeldung: Name = dein Vorname, Passwort = ${START_PASSWORD}. Danach legst du dein eigenes Passwort fest.`,
  ].join("\n");
}

/**
 * Kopiert den öffentlichen Umfrage-Link in die Zwischenablage – zum Teilen in
 * Teams, WhatsApp oder per Mail. Wahlweise nur der Link oder mit kurzer
 * Anleitung zur ersten Anmeldung. Fällt auf eine Auswahl-Markierung zurück,
 * wenn die Clipboard-API nicht verfügbar ist (z.B. ohne HTTPS).
 */
export function CopyLinkButton({ path, title }: { path: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Menü schließen bei Klick daneben oder Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copy(withInvite: boolean) {
    setOpen(false);
    const url = `${window.location.origin}${path}`;
    const text = withInvite ? inviteText(title, url) : url;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Link kopieren:", text);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="btn-ghost whitespace-nowrap"
      >
        {copied ? "✓ Kopiert" : "🔗 Link kopieren"}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-ink/[0.08] bg-white p-1.5 shadow-card-hover sm:left-auto sm:right-0"
        >
          {(
            [
              [false, "Nur Link", "Zum Einfügen, wo schon alles erklärt ist."],
              [true, "Mit Anleitung", `Titel, Link und Erst-Anmeldung (Vorname, ${START_PASSWORD}).`],
            ] as const
          ).map(([withInvite, label, hint]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => copy(withInvite)}
              className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-ff-navy/[0.04]"
            >
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span className="block text-xs text-ink-soft">{hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
