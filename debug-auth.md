# 🔧 Authentication Debug Guide

## Issues Fixed:

### 1. **Duplicate Callbacks** ✅ FIXED
- **Problem**: Both `auth.ts` and `auth.config.ts` had callback functions
- **Solution**: Removed duplicate callbacks from `auth.ts`, kept only in `auth.config.ts`

### 2. **Field Mapping Issues** ✅ FIXED
- **Problem**: Backend returns `id` but frontend expected `userId`
- **Problem**: Backend returns `emailVerified` but frontend expected `email_verified`
- **Solution**: Added proper field mapping in auth.config.ts

### 3. **User Data Structure** ✅ FIXED
- **Problem**: Not properly mapping backend response to NextAuth format
- **Solution**: Explicit user object mapping with all required fields

## Current Issues to Debug:

### 1. **Port Mismatch** 🔴
- You're accessing `http://localhost:3002` but dashboard should be on `http://localhost:3001`
- Backend should be on `http://localhost:3000`

### 2. **"User Not Found" Error** 🔴
- Error: "Хэрэглэгч олдсонгүй" (User not found)
- **Possible causes**:
  - No users in database
  - Wrong database connection
  - Case sensitivity in email/username

### 3. **Response Encoding Issues** 🔴
- Strange response: `0:{"a":"$@1","f":"","b":"development"}`
- This looks like a React/Next.js serialization error

## Debug Steps:

### Step 1: Check Environment Variables
Create `.env.local` in dashboard root:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3001
```

### Step 2: Verify Backend is Running
```bash
# Check backend is accessible
curl http://localhost:3000/api/v1/health

# Test backend login directly
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"password123"}'
```

### Step 3: Create Test User in Backend
```bash
# Go to backend directory
cd ayo-back

# Run user creation script (if exists)
npm run seed

# Or use the createAdmin script
node scripts/createAdmin.js
```

### Step 4: Test Dashboard on Correct Port
```bash
# Start dashboard on port 3001
cd ayo-dashboard
npm run dev

# Access on correct port
# http://localhost:3001/login
```

### Step 5: Debug Session
1. Open browser dev tools
2. Go to Network tab
3. Try login and check:
   - POST request to `/api/v1/auth/login`
   - Response status and data
   - Any CORS errors

## Fixed Code Changes:

### auth.ts (Simplified)
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  ...authConfig,
});
```

### auth.config.ts (Enhanced Data Mapping)
```typescript
// Fixed user data mapping
return {
  id: user.id,
  userId: user.id, // Map id to userId for compatibility
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  role: user.role,
  image: user.image,
  email_verified: user.emailVerified, // Map emailVerified to email_verified
  accessToken: user.accessToken
};
```

## Test Login:

1. **Correct URLs**:
   - Dashboard: `http://localhost:3001`
   - Backend: `http://localhost:3000`
   - Session API: `http://localhost:3001/api/auth/session`

2. **Test Credentials** (create these in backend first):
   - Email: `admin@test.com`
   - Password: `password123`

## Expected Flow:

1. User enters credentials on `http://localhost:3001/login`
2. Frontend sends POST to `http://localhost:3000/api/v1/auth/login`
3. Backend validates and returns user data with JWT
4. NextAuth creates session
5. Session available at `http://localhost:3001/api/auth/session`
6. User redirected to dashboard

## Next Steps After Fixing:

- [ ] Verify correct ports (3001 for dashboard, 3000 for backend)
- [ ] Check environment variables are set
- [ ] Create test user in backend database
- [ ] Test login flow with proper URLs
- [ ] Check session persistence