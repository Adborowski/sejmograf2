# Sejmograf

*An English version of this README is available below.*

**Sejmograf** śledzi, jak często polscy posłowie pojawiają się na głosowaniach. Dane pobierane są bezpośrednio z oficjalnego API Sejmu i aktualizowane codziennie, więc liczby są zawsze aktualne.

Aplikacja dostępna pod adresem: [sejmograf.pl](https://sejmograf.pl)

---

## Co można zrobić

### Sprawdź, kto głosuje — a kto nie
Główny ranking porządkuje wszystkich 460 posłów według frekwencji na głosowaniach. Na pierwszy rzut oka widać, którzy politycy sumiennie wykonują swoją pracę, a którzy regularnie są nieobecni.

### Porównaj kluby parlamentarne
Strona klubów pozwala zestawić frekwencję różnych ugrupowań — KO, PiS, TD, Lewicy i innych — na interaktywnym wykresie pokazującym, jak średnia każdego klubu zmieniała się w kolejnych posiedzeniach.

### Wyszukaj dowolnego posła
Każdy poseł ma swoją stronę profilową z:
- ogólną frekwencją na głosowaniach,
- wykresem pokazującym trend w kolejnych posiedzeniach Sejmu,
- podstawowymi informacjami: klub, okręg wyborczy.

### Szukaj i filtruj
Znajdź dowolnego posła po nazwisku, przefiltruj listę według klubu lub wyświetl tylko aktualnie aktywnych parlamentarzystów.

### Wystaw opinię
Zalogowani użytkownicy mogą zostawić krótką opinię na profilu każdego posła. Wystarczy bezpłatne konto — rejestracja przez e-mail lub Google.

### Kontakt
Masz uwagi lub zauważyłeś błąd? Skorzystaj z formularza kontaktowego na [sejmograf.pl/contact](https://sejmograf.pl/contact) — aplikacja jest w ciągłym rozwoju i chętnie słyszymy opinie.

---

## Dane

Dane o frekwencji pochodzą z oficjalnego API Sejmu i są aktualizowane automatycznie każdego dnia o 3:00 UTC. Każda aktualizacja pobiera najnowsze wyniki głosowań, oblicza frekwencję dla każdego posiedzenia i zapisuje wyniki do bazy danych.

---

## Technologie (dla współtwórców)

- **Next.js** App Router, renderowanie po stronie klienta
- **Firebase** — Firestore (dane), Auth (konta), Storage (zdjęcia posłów)
- **Tailwind CSS v4**
- **Recharts** — wykresy
- **Resend** — wysyłka e-maili z formularza kontaktowego
- Wdrożenie: **Vercel**; pipeline danych: **GitHub Actions**

Aby uruchomić lokalnie, utwórz plik `.env.local` ze zmiennymi konfiguracyjnymi Firebase i `RESEND_API_KEY`, a następnie:

```bash
npm install
npm run dev
```

---

## Licencja

MIT

---
---

# Sejmograf — English

**Sejmograf** tracks how often Polish members of parliament (posłowie) show up to vote. It pulls data directly from the official Sejm API and updates daily, so the numbers are always current.

Live at: [sejmograf.pl](https://sejmograf.pl)

---

## What you can do

### See who shows up — and who doesn't
The main leaderboard ranks all 460 MPs by their attendance rate across all voting sessions. You can see at a glance which politicians are doing their job and which ones are absent most of the time.

### Compare political clubs
The clubs page lets you compare attendance across parties — KO, PiS, TD, Lewica, and others — with an interactive chart showing how each club's average has changed over time.

### Look up any MP
Every MP has their own profile page with:
- Their overall attendance rate
- A chart showing attendance trend over each parliamentary sitting
- Basic info: club, constituency

### Search and filter
Find any MP by name, filter by political club, or show only currently active members.

### Leave a review
Logged-in users can leave a short text review on any MP's profile. Create a free account with email or sign in with Google.

### Contact
Got feedback or spotted an error? Use the contact form at [sejmograf.pl/contact](https://sejmograf.pl/contact) — the app is actively developed and feedback is welcome.

---

## Data

Attendance data comes from the official Sejm API and is updated automatically every day at 3AM UTC via a scheduled pipeline. Each update fetches the latest voting records, calculates attendance rates per sitting, and writes the results to Firestore.

---

## Tech (for contributors)

- **Next.js** App Router, all client-rendered
- **Firebase** — Firestore (data), Auth (accounts), Storage (MP photos)
- **Tailwind CSS v4**
- **Recharts** for charts
- **Resend** for contact form emails
- Deployed on **Vercel**; data pipeline on **GitHub Actions**

To run locally, copy `.env.local` with the Firebase config vars and `RESEND_API_KEY`, then:

```bash
npm install
npm run dev
```

---

## License

MIT
