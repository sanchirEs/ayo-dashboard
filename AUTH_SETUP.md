# Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
AUTH_SECRET=your-super-secret-key-here-make-it-long-and-random
AUTH_URL=http://localhost:3001
AUTH_TRUST_HOST=true

# Backend API Configuration
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

## Key Changes Made

### 1. Clean Auth Configuration (`auth.ts`)
- Consolidated all auth logic into a single file
- Proper error handling for backend login
- Clean JWT and session callbacks
- No more hardcoded ports or URLs

### 2. Simplified Middleware (`middleware.ts`)
- Clean route protection without loops
- Proper static asset handling
- Role-based access control
- No more complex matchers

### 3. Streamlined Routes (`routes.ts`)
- Clear separation of public, auth, and protected routes
- Simple role-based route definitions

### 4. Clean Login Flow
- Server actions for login/logout
- No client-side token fetching
- Proper error handling
- Simplified UI

## Usage

### Server-side (in Server Components/Actions)
```typescript
import { auth } from "@/auth";
import { apiFetch } from "@/lib/api-fetch";

// Get session
const session = await auth();

// Make authenticated API calls
const response = await apiFetch("/api/v1/products");
```

### Client-side (in Client Components)
```typescript
import { useSession, signOut } from "next-auth/react";

// Use session
const { data: session } = useSession();

// Logout
const handleLogout = () => signOut({ callbackUrl: "/login" });
```

## Running the Application

1. Set up environment variables
2. Start the backend server (should be on port 3000)
3. Run the dashboard: `npm run dev`
4. Access at `http://localhost:3001`

## Troubleshooting

- **Port issues**: Ensure backend is on port 3000 and dashboard on 3001
- **Login failures**: Check `BACKEND_URL` and backend auth endpoint
- **Redirect loops**: Clear browser cookies and restart dev server
- **Production issues**: Set `AUTH_URL` to your production domain
