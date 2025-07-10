# Session Logout Investigation Report

## Issue Summary
Users are experiencing frequent logouts with sessions not lasting more than a couple of hours, despite JWT tokens being configured for 30-day expiration.

## Investigation Findings

### Current Session Configuration

#### JWT Token Settings (`apps/api/src/util/jwt.ts`)
- **Token Expiration**: 30 days (`setExpirationTime("30d")`)
- **Cookie MaxAge**: 30 days (`60 * 60 * 24 * 30`)
- **Cookie Domain**: Dynamic based on request (`.${APP_DOMAIN}` or request hostname)
- **SameSite**: `"none"`
- **Secure**: `true` in production, `false` in development
- **HttpOnly**: `true`

#### Client-Side Storage (`apps/client/src/stores/auth-store.ts`)
- **Storage Type**: `sessionStorage` (clears when browser tab closes)
- **Query Refetch**: Every 5 minutes (`refetchInterval: 1000 * 60 * 5`)

## Potential Root Causes

### 1. **Cookie SameSite Configuration Issue** ⚠️ HIGH PRIORITY
```typescript
// Current setting in jwt.ts
sameSite: "none",
```
**Problem**: `sameSite: "none"` requires `secure: true` and can cause issues in certain browsers or when switching between HTTP/HTTPS contexts.

**Impact**: Browsers may reject or clear cookies, causing unexpected logouts.

### 2. **Dynamic Cookie Domain Handling** ⚠️ MEDIUM PRIORITY
```typescript
// Multiple domain setting logic in auth.controller.ts
const customCookieOptions = {
  ...cookieOptions,
  domain: req.headers.referer?.includes(APP_DOMAIN)
    ? `.${APP_DOMAIN}`
    : `.${new URL(req.headers.referer as string).hostname}`,
};
```
**Problem**: Complex domain logic can lead to inconsistent cookie setting/reading across subdomains.

**Impact**: Users may get logged out when navigating between different subdomains.

### 3. **No Session Refresh Mechanism** ⚠️ MEDIUM PRIORITY
**Problem**: JWT tokens have a fixed 30-day expiration with no refresh mechanism. No automatic token renewal for active users.

**Impact**: Even active users will be logged out after 30 days, and there's no way to extend sessions for active users.

### 4. **SessionStorage Usage** ⚠️ LOW PRIORITY
```typescript
storage: createJSONStorage(() => sessionStorage),
```
**Problem**: `sessionStorage` clears when browser tabs are closed, requiring re-authentication.

**Impact**: Users lose session state when closing/reopening browser tabs.

### 5. **Browser Security Policies** ⚠️ MEDIUM PRIORITY
**Problem**: Modern browsers have stricter cookie policies, especially for cross-site cookies with `sameSite: "none"`.

**Impact**: Cookies may be blocked or cleared based on browser security settings.

## Recommended Solutions

### Immediate Fixes (High Priority)

#### 1. Fix SameSite Cookie Configuration
```typescript
// apps/api/src/util/jwt.ts
export const cookieOptions: CookieOptions = {
  httpOnly: true,
  domain: `.${APP_DOMAIN}`,
  secure: true, // Always secure in production
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
  sameSite: "lax", // Change from "none" to "lax"
};
```

#### 2. Simplify Domain Handling
```typescript
// Standardize domain setting across all auth methods
const standardCookieOptions = {
  ...cookieOptions,
  domain: `.${APP_DOMAIN}`, // Always use the main domain
};
```

### Medium-Term Improvements

#### 3. Implement Session Refresh Mechanism
```typescript
// Add token refresh endpoint
export async function refreshToken(req: BareSessionRequest, res: Response) {
  const userId = req.auth?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Generate new token with extended expiration
  const newToken = await encrypt({
    id: req.auth.id,
    email: req.auth.email,
    name: req.auth.name,
    avatar: req.auth.avatar,
  });

  res.cookie(COOKIE_NAME, newToken, cookieOptions);
  res.json({ success: true });
}
```

#### 4. Add Automatic Token Refresh on Client
```typescript
// apps/client/src/lib/query/auth.ts
export const meQuery = queryOptions<MeQueryData>({
  queryKey: ['me'],
  queryFn: async () => {
    const response = await fetchClient('/auth/me');
    // Automatically refresh token if it's close to expiry
    await fetchClient('/auth/refresh', { method: 'POST' });
    return response;
  },
  refetchInterval: 1000 * 60 * 15, // Increase to 15 minutes
  // ... other options
});
```

#### 5. Switch to localStorage for Persistence
```typescript
// apps/client/src/stores/auth-store.ts
storage: createJSONStorage(() => localStorage), // Change from sessionStorage
```

### Additional Monitoring

#### 6. Add Session Debugging
```typescript
// Add logging to session middleware
export async function session(req: BareSessionRequest, res: Response, next: NextFunction) {
  const session = req.cookies[COOKIE_NAME];
  
  if (!session) {
    console.log('No session cookie found');
    next();
    return;
  }

  try {
    const decoded = await decrypt(session);
    console.log('Session decoded successfully', { userId: decoded.id, expiry: decoded.exp });
    // ... rest of the logic
  } catch (error) {
    console.error('Session decode error:', error.message);
    // ... error handling
  }
}
```

## Environment Variables to Check

Ensure these environment variables are properly set:
- `JWT_SECRET`: Should be a strong, consistent secret
- `APP_DOMAIN`: Should match your production domain
- `COOKIE_NAME`: Should be consistent across deployments

## Testing Steps

1. **Test Cookie Persistence**: Check browser dev tools to verify cookies are being set correctly
2. **Cross-Domain Testing**: Test session persistence across subdomains
3. **Browser Compatibility**: Test in different browsers (Chrome, Firefox, Safari)
4. **Network Analysis**: Monitor for any 401 errors that indicate session expiry

## Priority Implementation Order

1. ✅ **Fix SameSite configuration** (Immediate - likely root cause)
2. ✅ **Simplify domain handling** (Immediate)
3. ✅ **Add session debugging** (For monitoring)
4. 📋 **Implement token refresh** (Medium-term)
5. 📋 **Switch to localStorage** (Low priority)

## Expected Outcome

After implementing the high-priority fixes, users should experience:
- Sessions lasting the full 30 days as configured
- No unexpected logouts when navigating between pages/subdomains
- Consistent behavior across different browsers
- Better session persistence across browser restarts (with localStorage)