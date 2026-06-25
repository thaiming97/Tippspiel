"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { dayKey, formatDay } from "@/lib/format";

const POLL_MS = 8000;
const MAX_LEN = 1000;

/** Uhrzeit (HH:MM, Europe/Berlin) einer Nachricht. */
function clock(ms: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(ms));
}

/** Tages-Trennzeichen: „Heute", „Gestern" oder das Datum. */
function dayLabel(ms: number): string {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
  const key = dayKey(new Date(ms).toISOString());
  if (key === today) return "Heute";
  if (key === yesterday) return "Gestern";
  return formatDay(new Date(ms).toISOString());
}

/**
 * Community-Chat. Zeigt die Nachrichten chronologisch (älteste oben), eigene
 * rechts, fremde links. Hält sich per Polling (alle POLL_MS) aktuell und
 * scrollt bei neuen Nachrichten ans Ende, sofern man nicht gerade weiter oben
 * mitliest.
 */
export function Chat({
  initial,
  meId,
}: {
  initial: ChatMessage[];
  meId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Ob beim nächsten Render ans Ende gescrollt werden soll (nur, wenn der
  // Nutzer ohnehin schon unten mitliest – sonst reißt man ihn aus dem Lesen).
  const stickRef = useRef(true);

  function nearBottom(): boolean {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Hintergrund-Aktualisierung.
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        stickRef.current = nearBottom();
        setMessages(json.messages as ChatMessage[]);
      } catch {
        /* still im Hintergrund weiter versuchen */
      }
    }
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Nach jedem Update ggf. ans Ende scrollen.
  useLayoutEffect(() => {
    if (stickRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  async function send() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "Senden fehlgeschlagen");
      }
      const json = await res.json();
      const msg = json.message as ChatMessage;
      stickRef.current = true;
      // Dedupe, falls der Poll die Nachricht parallel schon geholt hat.
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Senden fehlgeschlagen");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sendet, Shift+Enter macht einen Zeilenumbruch.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Community</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Chat</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-pitch/8 px-3 py-1 text-xs font-semibold text-pitch">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-pitch" />
          live
        </span>
      </div>

      <div className="card !p-0 overflow-hidden">
        {/* Nachrichtenverlauf */}
        <div
          ref={scrollRef}
          className="flex h-[calc(100vh-22rem)] min-h-[18rem] flex-col gap-3 overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="m-auto max-w-xs text-center text-ink-soft">
              <div className="text-3xl">💬</div>
              <p className="mt-2 text-sm">
                Noch keine Nachrichten. Schreib die erste!
              </p>
            </div>
          ) : (
            messages.map((m, i) => {
              const mine = m.userId === meId;
              const prev = messages[i - 1];
              // Tages-Trenner, wenn der Tag wechselt.
              const showDay =
                !prev ||
                dayKey(new Date(prev.createdAt).toISOString()) !==
                  dayKey(new Date(m.createdAt).toISOString());
              // Absender-Kopf nur, wenn der Vorgänger von jemand anderem ist
              // (oder ein Tageswechsel dazwischenliegt).
              const showName =
                !mine && (showDay || !prev || prev.userId !== m.userId);

              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="my-2 flex items-center justify-center">
                      <span className="rounded-full bg-ink/[0.05] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                        {dayLabel(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex flex-col ${
                      mine ? "items-end" : "items-start"
                    }`}
                  >
                    {showName && (
                      <span className="mb-0.5 ml-1 text-xs font-semibold text-pitch">
                        {m.name}
                      </span>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] shadow-card ${
                        mine
                          ? "bg-pitch text-white"
                          : "border border-ink/[0.06] bg-white text-ink"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <span
                        className={`mt-0.5 block text-right text-[10px] tabular-nums ${
                          mine ? "text-white/70" : "text-ink-soft"
                        }`}
                        title={new Date(m.createdAt).toLocaleString("de-DE")}
                      >
                        {clock(m.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Eingabe */}
        <div className="border-t border-ink/[0.06] bg-paper/40 p-3">
          {error && (
            <p className="mb-2 px-1 text-xs font-medium text-red-600">{error}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Nachricht schreiben…"
              className="input max-h-32 min-h-[2.75rem] flex-1 resize-none"
            />
            <button
              onClick={() => void send()}
              disabled={sending || text.trim().length === 0}
              className="btn shrink-0"
              aria-label="Nachricht senden"
            >
              {sending ? "…" : "Senden"}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-ink-soft">
            Enter sendet · Shift+Enter für eine neue Zeile
          </p>
        </div>
      </div>
    </div>
  );
}
