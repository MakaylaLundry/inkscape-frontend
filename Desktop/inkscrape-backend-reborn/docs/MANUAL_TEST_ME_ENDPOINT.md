# Manual Test: First-Login User Bootstrap

Prerequisites:
- API running with valid JWT auth (`DEV_AUTH=true` or Auth0 token in `Authorization` header).
- No existing MongoDB `users` document for the test Auth0 subject.

## 1) First call creates user with null role

```bash
curl -i http://localhost:3001/api/v1/me \
  -H "x-dev-user-sub: auth0|new-user-123"
```

Expected:
- `200 OK`
- Response body shape:
  - `ok: true`
  - `user.id` present
  - `user.auth0UserId = "auth0|new-user-123"`
  - `user.role = null`
- One `users` document exists with `auth0UserId = "auth0|new-user-123"`.

## 2) Second call returns same user (no duplicates)

```bash
curl -i http://localhost:3001/api/v1/me \
  -H "x-dev-user-sub: auth0|new-user-123"
```

Expected:
- `200 OK`
- Same `user.id` as first call.
- Still `role = null`.
- MongoDB still has exactly one `users` document for that `auth0UserId`.

## 3) Role-gated route still blocked without role

```bash
curl -i http://localhost:3001/api/v1/artist/stub \
  -H "x-dev-user-sub: auth0|new-user-123"
```

Expected:
- `403`
- Error code `ROLE_REQUIRED` (or existing equivalent).
