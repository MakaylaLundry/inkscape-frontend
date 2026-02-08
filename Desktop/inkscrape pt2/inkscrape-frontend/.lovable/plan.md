
# Plan: Align Frontend with Backend API and Implement Role Persistence

## Problem Summary

The frontend is calling endpoints that don't exist on your backend:
- Frontend calls `GET /api/v1/user/profile` - doesn't exist
- Frontend calls `PUT /api/v1/user/profile` - doesn't exist

Your backend currently has:
- `GET /health` - health check
- `GET /auth/me` - returns current authenticated subject
- `GET /artist/stub` - artist role check
- `GET /company/stub` - company role check

## Solution: Two-Phase Approach

Since you control the backend, the recommended approach is:

**Phase 1 (Frontend - I will implement):** Update the frontend to work gracefully while role endpoints are being added to your backend

**Phase 2 (Backend - you implement):** Add the user profile endpoints to your backend

---

## Phase 1: Frontend Changes

### 1. Update API Client

Replace the user profile endpoint paths to match a standard pattern:

```
GET  /api/v1/user/profile  (keep as-is, backend will add)
PUT  /api/v1/user/profile  (keep as-is, backend will add)
```

### 2. Update AuthContext to Handle Missing Endpoints Gracefully

Modify `AuthContext.tsx` to:
- Try to fetch profile from backend
- If endpoint returns 404 (not found), treat user as not having a role yet
- Fall back to localStorage temporarily while backend endpoint is pending
- Once backend endpoint is ready, role persists across all devices

```tsx
useEffect(() => {
  const syncTokenAndFetchProfile = async () => {
    if (auth0IsAuthenticated) {
      setIsRoleLoading(true);
      try {
        const token = await getAccessTokenSilently();
        apiClient.setAccessToken(token);
        
        try {
          // Try to fetch from backend first
          const profile = await apiClient.getUserProfile();
          setRoleState(profile.role);
        } catch (profileError: any) {
          // If 404, endpoint doesn't exist yet - use localStorage fallback
          if (profileError.status === 404) {
            const savedRole = localStorage.getItem('user_role');
            setRoleState(savedRole as UserRole);
          } else {
            throw profileError;
          }
        }
      } catch (error) {
        console.error('Failed to get access token or fetch profile:', error);
        apiClient.setAccessToken(null);
        setRoleState(null);
      } finally {
        setIsRoleLoading(false);
      }
    } else {
      apiClient.setAccessToken(null);
      setRoleState(null);
    }
  };

  syncTokenAndFetchProfile();
}, [auth0IsAuthenticated, getAccessTokenSilently]);
```

### 3. Update setRole Function

```tsx
const setRole = async (newRole: UserRole) => {
  if (newRole) {
    // Save to localStorage as fallback
    localStorage.setItem('user_role', newRole);
    
    try {
      // Try to save to backend (will fail with 404 until endpoint exists)
      await apiClient.updateUserProfile({ role: newRole });
    } catch (error: any) {
      // If 404, backend endpoint doesn't exist yet - that's okay
      if (error.status !== 404) {
        console.error('Failed to save role to backend:', error);
      }
    }
    
    setRoleState(newRole);
  } else {
    localStorage.removeItem('user_role');
    setRoleState(null);
  }
};
```

### 4. Add URL-based Role Detection as Fallback

Update `DashboardLayout.tsx` to infer role from URL when state is not available:

```tsx
const location = useLocation();

// Infer role from URL path as fallback
const inferredRole = location.pathname.startsWith('/artist') 
  ? 'artist' 
  : location.pathname.startsWith('/company') 
    ? 'company' 
    : null;

const effectiveRole = role || inferredRole;
const navItems = effectiveRole === 'artist' ? artistNavItems : companyNavItems;
const dashboardTitle = effectiveRole === 'artist' ? 'Artist Dashboard' : 'Company Dashboard';
```

---

## Phase 2: Backend Changes (For You to Implement)

Add these endpoints to your backend:

### GET /api/v1/user/profile

Returns the authenticated user's profile including their role.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "auth0_sub": "auth0|abc123",
    "role": "artist",  // or "company" or null
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response (404) if user has no profile yet:**
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User profile not found"
  }
}
```

### PUT /api/v1/user/profile

Creates or updates the user's profile (role selection).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "artist"  // or "company"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "data": {
    "auth0_sub": "auth0|abc123",
    "role": "artist",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Add localStorage fallback, handle 404 gracefully |
| `src/components/layouts/DashboardLayout.tsx` | Add URL-based role inference as fallback |
| `src/pages/Onboarding.tsx` | Ensure role saves to both localStorage and backend |

---

## Expected Behavior

### Before Backend Endpoints Exist:
1. User logs in via Auth0
2. Frontend tries to fetch profile, gets 404
3. Falls back to localStorage for role
4. User completes onboarding, role saved to localStorage
5. Future page loads use localStorage role
6. Navigation works correctly for Artist vs Company dashboards

### After You Add Backend Endpoints:
1. User logs in via Auth0
2. Frontend fetches profile from backend successfully
3. Role is synchronized across all devices/browsers
4. localStorage no longer needed (but still used as backup)

---

## Summary of Changes

The key improvements:
1. **Graceful degradation**: Frontend works even when backend endpoints don't exist yet
2. **URL-based role inference**: Dashboard navigation always shows correct items based on URL path
3. **localStorage fallback**: Role persists locally until backend is ready
4. **Backend-first when available**: Once backend endpoints exist, they take priority
