"use client";

import { useState } from "react";

/**
 * Kopiert den öffentlichen Umfrage-Link in die Zwischenablage – zum Teilen in
 * Teams, WhatsApp oder per Mail. Fällt auf eine Auswahl-Markierung zurück,
 * wenn die Clipboard-API nicht verfügbar ist (z.B. ohne HTTPS).
 */
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Link kopieren:", url);
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-ghost whitespace-nowrap">
      {copied ? "✓ Kopiert" : "🔗 Link kopieren"}
    </button>
  );
}
