# Sejmograf — Project Guide

Polish Parliament (Sejm) attendance tracker. Tracks MEP voting attendance, displays stats, leaderboards, club comparisons, and allows logged-in users to leave reviews.

## Tech Stack
- **Next.js 16.1.6** (App Router, all pages are `'use client'`)
- **React 19, TypeScript 5**
- **Tailwind CSS v4** (imported via `@import "tailwindcss"` in globals.css — no config file)
- **Firebase** (Auth, Firestore, Storage, RTDB)
- **Recharts** (attendance line charts)
- **Resend** (contact form emails)
- **react-icons** (FaSatelliteDish logo)

## Key File Locations
```
app/                        # All routes (App Router)
  page.tsx                  # Home — hero + leaderboard preview + charts
  leaderboard/page.tsx      # Full attendance ranking
  clubs/page.tsx            # Club browser with chart
  club/[id]/page.tsx        # Single club detail + member list
  mep/[id]/page.tsx         # MEP detail + voting chart + reviews
  search/page.tsx           # MEP search + filters
  contact/page.tsx          # Contact form (Resend)
  privacy/page.tsx          # Privacy policy
  api/contact/route.ts      # POST handler for contact emails
  layout.tsx                # Root layout: Providers wrapper + footer

components/
  layout/NavBar.tsx         # SHARED navbar — use on every page
  leaderboard/
    MepRankRow.tsx          # MEP row for ranking lists
    AttendanceChart.tsx     # Multi-club line chart (Recharts)
    ClubCards.tsx           # Club summary cards
  meps/
    MepList.tsx             # Paginated grid with filters
    MepCard.tsx             # Single MEP card
    MepFilters.tsx          # Search + club + active filters
  mep/
    MepAttendanceChart.tsx  # Per-MEP attendance chart
    ReviewsSection.tsx      # Reviews + form (auth-gated)
  dashboard/
    BiggestMovers.tsx       # Rank changes between snapshots
    RecentReviews.tsx       # Latest reviews across all MEPs

hooks/
  useMeps.ts               # Primary data hook — all MEP fetching
  useReviews.ts            # MEP reviews fetching + reload
  useLeaderboardMovers.ts  # Rank change calculations

lib/
  clubStyles.ts            # Club colors, full names, logos
  firebase/
    config.ts              # Firebase init
    firestore.ts           # Firestore queries (getAllMeps, getMep)
    storage.ts             # getMepPhotoDirectURL(id)
    auth.ts                # signIn, signUp, signOut, signInGoogle
    reviews.ts             # Review CRUD (getReviews, submitReview)

types/mep.ts               # Mep, VotingStat, Review, LeaderboardSnapshot
```

## NavBar Usage (required on every page)
```tsx
import { NavBar } from '@/components/layout/NavBar';
// Props: subtitle?, backHref?, navLinks?, maxWidth?
<NavBar backHref="/" maxWidth="max-w-4xl" />
<NavBar subtitle="Monitor Polskiego Sejmu" navLinks={[{ href: '/leaderboard', label: 'Pełny ranking' }]} />
```
- maxWidth options: `'max-w-4xl' | 'max-w-5xl' | 'max-w-7xl'`
- Mobile hamburger menu built in

## Page Structure Pattern
```tsx
'use client';
import { NavBar } from '@/components/layout/NavBar';
export default function PageName() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? <LoadingSpinner /> : error ? <ErrorAlert /> : <Content />}
      </main>
    </div>
  );
}
```

## Loading/Error State Pattern
```tsx
{loading ? (
  <div className="flex items-center justify-center py-24">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
  </div>
) : error ? (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <p className="text-red-700">{error}</p>
  </div>
) : ( <Content /> )}
```

## Form Input Classes (must match LoginForm standard)
```tsx
// Text inputs + textareas:
className="text-neutral-950 placeholder-neutral-500 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
// Labels:
className="block text-sm font-medium text-gray-700 mb-1"   // (or text-neutral-950 for auth forms)
// Submit button:
className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition-colors"
```

## Tailwind Conventions
- **Container:** `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **Cards:** `bg-white rounded-lg shadow-md p-6`
- **Primary buttons:** `bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2`
- **Nav links (blue pill):** `px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm`
- **Dividers:** `divide-y divide-gray-100`
- **Mobile-first:** base = mobile, `sm:` = 640px+, `lg:` = 1024px+
- Background: always `bg-gray-50` for page, `bg-white` for cards/nav/footer

## Firebase Data
- **Firestore collection:** `meps/{mepId}` — Mep objects
- **Reviews subcollection:** `mep_reviews/{mepId}/reviews/{userId}`
- **Leaderboard snapshots:** `leaderboard_snapshots/{sitting}`
- **Photos:** `getMepPhotoDirectURL(mep.id)` → Firebase Storage CDN URL
- **Auth:** email/password + Google OAuth via `useAuth()` context

## Data Fetching
```tsx
// All hooks return { data, loading, error }
const { meps, loading, error } = useMeps();            // all MEPs
const { meps } = useMeps({ club: 'KO' });             // filtered by club
const { reviews, reload } = useReviews(mepId);
```

## Club System
- Club abbreviations: `KO`, `PiS`, `TD`, `Lewica`, `KP`, `PLS`, `Polska2050`, etc.
- `getClubColorMap(clubs)` → stable color assignments (alphabetical order)
- `CLUB_FULL_NAMES` → full display names
- `CLUB_LOGOS` → Sejm API logo URLs

## TypeScript
- Main type: `Mep` from `@/types/mep`
- `attendanceRate` is 0–1 (multiply by 100 for %)
- `votingStats` is `Record<number, VotingStat>` (key = sitting number)
- Hooks return `any[]` for meps in most places (typed at usage with `as Mep[]`)

## AttendanceChart Props
```tsx
<AttendanceChart meps={meps} initialVisible={['KO']} />
// initialVisible: clubs pre-enabled; overall always available; others hidden
// meps should be full dataset (all MEPs) for correct overall line
```

## Language
- All UI text in **Polish**
- Error messages, labels, placeholders: Polish
- Code comments: English

## Environment Variables
```
NEXT_PUBLIC_FIREBASE_*     # Firebase client config (7 vars)
RESEND_API_KEY             # Contact form email (server-side only)
GOOGLE_APPLICATION_CREDENTIALS  # Base64 service account (CI only)
```

## Deployment
- **Frontend:** Vercel
- **Data pipeline:** GitHub Actions cron (daily 3AM UTC) → scraping → Firestore upload
- **No SSR** — all pages client-rendered, data from Firestore

## Scraping Pipeline (do not modify without care)
```
scraping/scraper-basic.js        # Fetch MEPs + photos from Sejm API
scraping/scraper-voting.js       # Fetch voting records
scraping/aggregate-voting-stats.js  # Group by sitting
scripts/uploadToFirestore.js     # Batch write to Firestore
scripts/uploadToStorage.js       # Push photos to Storage
scripts/saveLeaderboardSnapshot.js  # Create ranking snapshot
```
