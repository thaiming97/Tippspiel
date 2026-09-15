# 🍽️ FF Entertainment

Terminabstimmungen für **Feli & Felix · Essen & Ausflüge** – die eigene
Doodle-Alternative der Abteilung. Wer abstimmt, braucht **kein Konto**; wer
Umfragen anlegt und auswertet, meldet sich als **Organisator** an.

## Funktionen

- **Umfragen selbst zusammenstellen**: Titel, Einleitung, Termine und eine
  Auswahl (Restaurants, Ausflugsziele …) legt der Organisator im Admin-Bereich
  fest – beliebig viele Umfragen parallel.
- **Termin-Generator**: „jeden Do und Fr vom 12.11. bis 18.12." erzeugt die
  Terminliste auf Knopfdruck; einzelne Tage lassen sich ergänzen oder entfernen.
- **Abstimmen ohne Anmeldung**: je Termin **Ja / Wenn nötig / Nein**,
  Mehrfachauswahl bei den Optionen, optionale Anmerkung. Derselbe Name
  bearbeitet die eigene Antwort statt eine zweite Zeile anzulegen.
- **Auswertung im Doodle-Stil**: beste Termine nach Zusagen, Stimmen je Option,
  vollständige Übersichts-Tabelle.
- **Steuerung**: Abstimmung schließen, Stand vor den Teilnehmern verbergen,
  endgültigen Termin + Option + Hinweis festlegen (erscheint als Banner auf der
  öffentlichen Seite), einzelne Antworten oder ganze Umfragen löschen.
- **Optik je Umfrage**: „Normal" oder „Weihnachtlich" (Schnee & Tanne).

## Seiten

| Seite | Zweck | Zugang |
| --- | --- | --- |
| `/` | Übersicht der laufenden Umfragen | öffentlich |
| `/umfrage/<slug>` | abstimmen + aktueller Stand | öffentlich |
| `/login` | Anmeldung der Organisatoren | – |
| `/admin` | Umfragen anlegen und verwalten | nur Organisatoren |
| `/admin/umfragen/<slug>` | auswerten, steuern, bearbeiten | nur Organisatoren |
| `/admin/users` | Organisatoren-Konten | nur Organisatoren |

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
`responses/<normalisierter Name>` mit den Antworten. `users` enthält die
Organisatoren-Konten.

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
npm run seed:weihnachtsessen      # optional: Weihnachtsessen-Umfrage anlegen
npm run dev                       # http://localhost:3000
```

`npm run seed:weihnachtsessen` legt die Umfrage „Weihnachtsessen der
Abteilung" mit allen Donnerstagen und Freitagen vom 12.11. bis 18.12. sowie den
drei Restaurants an und übernimmt Antworten aus der früheren, fest
verdrahteten Fassung. Das Skript ist mehrfach aufrufbar und überschreibt eine
bestehende Umfrage nicht.

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
