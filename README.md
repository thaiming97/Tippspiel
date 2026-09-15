# 🍽️ FF Entertainment

Terminabstimmungen für **Feli & Felix · Essen & Ausflüge** – die eigene
Doodle-Alternative der Abteilung. Jeder meldet sich mit einem Konto an, damit
**nur er selbst** seine Antwort ändern kann. Konten legt entweder der
Organisator an oder man registriert sich selbst.

## Funktionen

- **Umfragen selbst zusammenstellen**: Titel, Einleitung, Termine und eine
  Auswahl (Restaurants, Ausflugsziele …) legt der Organisator im Admin-Bereich
  fest – beliebig viele Umfragen parallel.
- **Termin-Generator**: „jeden Do und Fr vom 12.11. bis 18.12." erzeugt die
  Terminliste auf Knopfdruck; einzelne Tage lassen sich ergänzen oder entfernen.
- **Abstimmen**: je Termin **Ja / Wenn nötig / Nein**, Mehrfachauswahl bei den
  Optionen, optionale Anmerkung. Die Antwort hängt am Konto: sie ist beim
  Öffnen vorbelegt und jederzeit änderbar – fremde Antworten kann niemand
  überschreiben.
- **Konten**: Selbstregistrierung unter `/registrieren` (Passwort gleich selbst
  setzen) oder vom Organisator angelegt (Startpasswort, muss beim ersten Login
  geändert werden). Der Organisator kann Passwörter zurücksetzen.
- **Schnellwahl**: „Kann immer" setzt alle Termine auf Ja, „Bin komplett raus"
  meldet für alle Termine ab. Eine Absage zählt als abgegebene Antwort und
  wird in der Übersicht ausgewiesen – der Organisator weiß dann, dass er auf
  diese Person nicht warten muss.
- **Auswertung im Doodle-Stil**: beste Termine nach Zusagen, Stimmen je Option,
  vollständige Übersichts-Tabelle.
- **Steuerung**: Abstimmung schließen, Stand vor den Teilnehmern verbergen,
  endgültigen Termin + Option + Hinweis festlegen (erscheint als Banner auf der
  öffentlichen Seite), einzelne Antworten oder ganze Umfragen löschen.
- **Optik je Umfrage**: „Normal" oder „Weihnachtlich" (Schnee & Tanne).

## Seiten

| Seite | Zweck | Zugang |
| --- | --- | --- |
| `/login`, `/registrieren` | anmelden bzw. selbst ein Konto anlegen | offen |
| `/` | Übersicht der laufenden Umfragen | angemeldet |
| `/umfrage/<slug>` | abstimmen + aktueller Stand | angemeldet |
| `/change-password` | eigenes Passwort festlegen | angemeldet |
| `/admin` | Umfragen anlegen und verwalten | nur Organisatoren |
| `/admin/umfragen/<slug>` | auswerten, steuern, bearbeiten | nur Organisatoren |
| `/admin/users` | Konten anlegen, Passwörter zurücksetzen | nur Organisatoren |

Ein geteilter Umfrage-Link führt zunächst auf die Anmeldung und danach
automatisch auf die Umfrage weiter (`?weiter=…`).

Der Link einer Umfrage ist ihr Slug (aus dem Titel erzeugt) und bleibt stabil,
auch wenn der Titel später geändert wird.

## Tech-Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Firebase / Firestore** als Datenbank – Zugriff ausschließlich serverseitig
  über das Firebase Admin SDK (`firestore.rules` sperrt Client-Zugriffe
  komplett). Antworten und Umfragen liegen im Next.js Data Cache und werden bei
  jeder Änderung gezielt entwertet.
- Eigene Authentifizierung (bcrypt-Passwörter, signierte JWT-Session-Cookies)

Datenmodell: `polls/<slug>` je Umfrage, darunter die Unter-Sammlung
`responses/<Benutzer-ID>` mit den Antworten – die Benutzer-ID als Dokument-ID
sorgt dafür, dass jeder genau eine Antwort je Umfrage hat und nur seine
eigene ändern kann. `users` enthält alle Konten (Rolle `user` = abstimmen,
`admin` = zusätzlich verwalten).

## Einrichtung

### 1. Firebase-Projekt

1. In der [Firebase Console](https://console.firebase.google.com) ein Projekt
   anlegen und **Firestore** aktivieren (Modus: Produktion).
2. **Projekteinstellungen → Dienstkonten → Neuen privaten Schlüssel
   generieren**. Daraus werden `project_id`, `client_email` und `private_key`
   gebraucht.
3. Die Datei `firestore.rules` als Firestore-Regeln hinterlegen.

### 2. Umgebungsvariablen

```bash
cp .env.example .env.local
```

- `AUTH_SECRET` – langer Zufallsstring (`openssl rand -hex 32`)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` – für den ersten Organisator

### 3. Installieren & starten

```bash
npm install
npm run create-admin              # ersten Organisator anlegen
npm run seed:users                # Konten der Runde, Passwort: start123
npm run seed:weihnachtsessen      # optional: Weihnachtsessen-Umfrage anlegen
npm run dev                       # http://localhost:3000
```

`npm run seed:users` legt die Konten der Kollegen an (Namen stehen in
`scripts/seed-users.ts`) bzw. setzt deren Passwort auf **`start123`** und
verlangt beim ersten Login ein eigenes. Bestehende Konten behalten Rolle und
E-Mail. Mehrfach aufrufbar. Achtung: Steht dein eigener Name in der Liste,
wird auch dein Passwort zurückgesetzt.

Die Weihnachtsessen-Umfrage gibt es als **fertige Vorlage** – entweder per
Knopf „Jetzt anlegen" oben im Admin-Bereich (kein Terminal nötig) oder per
`npm run seed:weihnachtsessen`. Beide Wege legen dieselbe Umfrage an (alle
Donnerstage und Freitage vom 12.11. bis 18.12., die drei Restaurants,
weihnachtliche Optik) und übernehmen Antworten aus der früheren, fest
verdrahteten Fassung. Beide sind mehrfach aufrufbar und überschreiben eine
bestehende Umfrage nicht. Die Vorlage selbst steht in `lib/polls.ts`
(`WEIHNACHTSESSEN`).

## Deployment

### Variante A: Vercel – empfohlen

1. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → Projekt
   importieren.
2. Unter **Environment Variables** eintragen: `AUTH_SECRET`,
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
3. **Deploy**.

### Variante B: Firebase App Hosting (Blaze-Tarif)

Konfiguration liegt in `apphosting.yaml`; `AUTH_SECRET` per
`firebase apphosting:secrets:set` anlegen und das Backend in der Console mit
dem GitHub-Repo verbinden.

> Der Firebase-Projektname (`tippspiel-vorserie`) stammt noch aus der
> Vorgeschichte des Repos. Er ist nur die Datenbank-Adresse und für die
> Besucher nicht sichtbar – ein Umzug wäre ein neues Firebase-Projekt samt
> Datenübernahme.
