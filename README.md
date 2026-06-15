# ⚽ WM-Tippspiel 2026

Ein Tippspiel für die Arbeit zur Fußball-WM 2026. Kolleginnen und Kollegen
tippen Spielergebnisse, Punkte werden automatisch vergeben, und eine
**Live-Rangliste** zeigt jederzeit, wer führt.

## Funktionen

- **Login** mit E-Mail & Passwort. Benutzer werden vom Admin angelegt und
  bekommen ein **Startpasswort**, das bei der **ersten Anmeldung geändert**
  werden muss. Beim ersten Login wählt jeder seinen **Tipp-Umfang**:
  - **Nur Gruppe E** (1€-Pool) oder **Alle Spiele**.
  - Später jederzeit unter **Einstellungen** änderbar.
- **Tipps & Punkte** (Wertung wie bei **CHECK24**): Ergebnis tippen bis zum
  Anstoß.
  - exaktes Ergebnis → **4 Punkte**
  - richtige Tordifferenz (kein Remis) → **3 Punkte**
  - richtige Tendenz → **2 Punkte**
- **Live-Rangliste** (alle 15 Sek.) – mit **getrennter Auswertung** für
  „Nur Gruppe E" und „Alle Spiele".
- **Admin-Bereich** (kann alles): Benutzer anlegen/zurücksetzen/löschen,
  Spiele anlegen, Ergebnisse pflegen, Sync starten.
- **Ergebnisse automatisch aus dem Internet** über [football-data.org]
  – per Knopfdruck im Admin oder zeitgesteuert per Cron.

## Tech-Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Firebase / Firestore** als Datenbank (Zugriff nur serverseitig über das
  Firebase Admin SDK)
- Eigene Authentifizierung (bcrypt-Passwörter, signierte JWT-Session-Cookies)

## Einrichtung

### 1. Firebase-Projekt anlegen

1. In der [Firebase Console](https://console.firebase.google.com) ein Projekt
   anlegen und **Firestore** aktivieren (Modus: Produktion).
2. **Projekteinstellungen → Dienstkonten → Neuen privaten Schlüssel
   generieren**. Aus der JSON-Datei brauchst du `project_id`, `client_email`
   und `private_key`.
3. Die Datei `firestore.rules` als Firestore-Regeln hinterlegen (Client-Zugriff
   ist komplett gesperrt – die App schreibt nur über das Admin SDK).

### 2. Umgebungsvariablen

```bash
cp .env.example .env.local
```

Dann `.env.local` ausfüllen:

- `AUTH_SECRET` – langer Zufallsstring (`openssl rand -hex 32`)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- `FOOTBALL_DATA_API_TOKEN` – kostenloses Token von
  [football-data.org](https://www.football-data.org/client/register)
  (optional – ohne Token können Ergebnisse manuell im Admin eingetragen werden)
- `CRON_SECRET` – Geheimnis für den automatischen Sync
- `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` – für den ersten Admin

### 3. Installieren & Daten anlegen

```bash
npm install
npm run create-admin   # legt den ersten Admin an
npm run seed           # legt Teilnehmer, Spiele + alle Tipps an
```

`npm run seed` legt an:

- alle **14 Teilnehmer** aus dem Excel-Tippblatt (mit zufälligem Startpasswort –
  die Liste wird am Ende ausgegeben, bitte notieren & verteilen),
- die **6 Gruppe-E-Spiele** inkl. der echten Ergebnisse der bereits gespielten
  Partien (Deutschland 7:1 Curaçao, Elfenbeinküste 1:0 Ecuador),
- weitere WM-Spiele ab 15.06. für den Modus „Alle Spiele",
- **alle abgegebenen Tipps** inkl. Punkteberechnung.

> Hinweis: Die E-Mail-Adressen der Teilnehmer sind Platzhalter
> (`name@wm-tippspiel.local`) – sie dienen nur als Login. Bei Bedarf vor dem
> Verteilen in `data/groupE.ts` anpassen.

### 4. Starten

```bash
npm run dev            # http://localhost:3000
```

Mit den Admin-Zugangsdaten anmelden → unter **Admin** weitere Benutzer anlegen
und (falls Token gesetzt) den Sync starten, um den vollständigen Spielplan und
Live-Ergebnisse zu laden.

## Automatischer Ergebnis-Sync

Der Endpunkt `GET /api/cron/sync` zieht Spielplan + Ergebnisse und berechnet die
Punkte neu. Er ist per `CRON_SECRET` geschützt:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<deine-domain>/api/cron/sync
```

Bei einem Deploy auf **Vercel** ist in `vercel.json` bereits ein Cron-Job
hinterlegt (alle 10 Minuten). Vercel sendet das `CRON_SECRET` automatisch als
Bearer-Token mit. Alternativ funktioniert jeder andere Scheduler (GitHub
Actions, Cloud Scheduler, Cronjob.org …).

## Deployment

Empfohlen: **Vercel**. Repository verbinden, die Umgebungsvariablen aus
`.env.local` als Projekt-Variablen hinterlegen, deployen. Der Cron-Job läuft
dann automatisch.

[football-data.org]: https://www.football-data.org
