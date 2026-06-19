import { getSession } from "@/lib/auth";
import { getMessages } from "@/lib/chat";
import { Chat } from "@/components/Chat";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  // Nachrichten serverseitig vorladen -> Chat ist beim Öffnen sofort da,
  // danach hält die Client-Komponente ihn per Polling aktuell.
  const [messages, session] = await Promise.all([getMessages(), getSession()]);
  return <Chat initial={messages} meId={session!.sub} />;
}
