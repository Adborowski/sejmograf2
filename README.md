# Sejmograf2

A modern Next.js application with Firebase Realtime Database and Authentication.

## Features

- ✅ **Next.js 14+** with App Router and React Server Components
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** for styling
- ✅ **Firebase Authentication** (Email/Password + Google OAuth)
- ✅ **Firebase Realtime Database** with custom hooks
- ✅ **Protected Routes** with authentication guards
- ✅ **Responsive Design** with mobile-first approach

## Project Structure

```
sejmograf2/
├── app/                       # Next.js app directory
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Home page
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   └── dashboard/            # Protected dashboard page
├── components/
│   └── auth/                 # Authentication components
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx       # Auth state management
├── providers/
│   └── Providers.tsx         # Provider wrapper
├── hooks/
│   ├── useFirebaseAuth.ts    # Auth hooks
│   └── useRealtimeDatabase.ts # Database hooks
├── lib/
│   └── firebase/             # Firebase configuration
│       ├── config.ts         # Firebase initialization
│       ├── auth.ts           # Auth utilities
│       └── database.ts       # Database utilities
└── .env.local.example        # Environment template
```

## Getting Started

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password** provider
   - Enable **Google** provider (add your OAuth client)
4. Enable **Realtime Database**:
   - Go to Realtime Database
   - Click "Create Database"
   - Start in **test mode** (you'll configure security rules later)
   - Choose a location
5. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll down to "Your apps"
   - Click the web icon (</>) to add a web app
   - Copy the configuration values

### 2. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
   ```

### 3. Install Dependencies

If not already installed, run:
```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication

The app provides complete authentication flows:

- **Sign up**: Navigate to `/signup` to create a new account
- **Login**: Navigate to `/login` to sign in
- **Google OAuth**: Click "Sign in with Google" on the login page
- **Dashboard**: Protected route at `/dashboard` (requires authentication)

### Using Auth in Components

```tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Welcome, {user.email}</div>;
}
```

### Using Realtime Database

#### Read Data (one-time)

```tsx
import { useReadData } from '@/hooks/useRealtimeDatabase';

const { data, loading, error } = useReadData('users/123');
```

#### Subscribe to Real-time Updates

```tsx
import { useRealtimeData } from '@/hooks/useRealtimeDatabase';

const { data, loading, error } = useRealtimeData('messages');
// Data updates automatically when changed in Firebase
```

#### Write Data

```tsx
import { useDatabaseWrite } from '@/hooks/useRealtimeDatabase';

const { write, update, remove, push, loading, error } = useDatabaseWrite();

// Write data
await write('users/123', { name: 'John', age: 30 });

// Update specific fields
await update('users/123', { age: 31 });

// Add to a list
const key = await push('messages', { text: 'Hello!', timestamp: Date.now() });

// Delete data
await remove('users/123');
```

### Protecting Routes

Wrap any page with `ProtectedRoute` to require authentication:

```tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>This content requires authentication</div>
    </ProtectedRoute>
  );
}
```

## Firebase Security Rules

**Important**: The database is currently in test mode. Before deploying to production, configure security rules:

### Realtime Database Rules Example

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "public": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

This is a standard Next.js app and can be deployed to:
- AWS Amplify
- Netlify
- Railway
- Render
- DigitalOcean App Platform
- Self-hosted VPS

## Notes

- Firebase API keys are safe to expose (protected by Firebase security rules)
- Configure Firebase security rules before production
- Google OAuth requires setting up OAuth consent screen in Google Cloud Console
- Email verification can be enabled in Firebase Authentication settings

## License

MIT
