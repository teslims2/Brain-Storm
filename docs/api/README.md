# Brain-Storm API Reference

This document provides a detailed guide to the Brain-Storm API, including endpoints, authentication, request/response examples, error codes, and the interactive explorer.

## Overview

The Brain-Storm API is versioned under `/v1` and supports authentication with JWT bearer tokens. Most responses are wrapped in a standard format:

```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Interactive API Explorer

The backend exposes interactive Swagger documentation at:

- Local development: `http://localhost:3000/api/docs`
- Static hosting: `docs/api/swagger-ui.html`

The interactive explorer supports:

- browsing all available endpoints
- expanding request and response schemas
- sending authenticated requests using the `Authorize` button
- downloading the generated OpenAPI spec from `docs/api/dist/openapi.json`

## Authentication Guide

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepass123"}'
```

Example response:

```json
{
  "data": {
    "access_token": "eyJhbGciOi..."
  },
  "statusCode": 200,
  "timestamp": "2026-05-29T00:00:00.000Z"
}
```

### 3. Authorize requests

Use the returned JWT token for protected endpoints:

```bash
curl -X GET http://localhost:3000/v1/courses \
  -H "Authorization: Bearer <access_token>"
```

### 4. Token refresh

```bash
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

### Supported auth flows

- email/password registration
- login with optional MFA token
- refresh and logout
- email verification, resend verification, forgot password, reset password
- protected routes using `Authorization: Bearer <token>`
- admin-only routes under `admin/*` and MFA-protected actions

## Endpoint Reference

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/register` | No | Register a new user |
| POST | `/v1/auth/login` | No | Login and obtain JWT |
| POST | `/v1/auth/refresh` | No | Refresh access token |
| POST | `/v1/auth/logout` | No | Revoke refresh token |
| GET | `/v1/auth/verify?token=...` | No | Verify email address |
| POST | `/v1/auth/resend-verification` | No | Resend verification email |
| POST | `/v1/auth/forgot-password` | No | Request password reset |
| POST | `/v1/auth/reset-password` | No | Reset password with token |
| POST | `/v1/auth/mfa/enable` | JWT | Enable MFA for signed-in user |
| POST | `/v1/auth/mfa/verify` | JWT | Verify MFA code |
| POST | `/v1/auth/mfa/disable` | JWT | Disable MFA |
| POST | `/v1/auth/admin/api-keys` | JWT + admin | Generate an API key |
| POST | `/v1/auth/admin/api-keys/revoke` | JWT + admin | Revoke an API key |

### Courses and content

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/courses` | Optional | List published courses |
| GET | `/v1/courses/:id` | Optional | Get course details |
| POST | `/v1/courses` | JWT + instructor/admin | Create a course |
| PATCH | `/v1/courses/:id` | JWT + instructor/admin | Update a course |
| DELETE | `/v1/courses/:id` | JWT + instructor/admin | Delete a course |
| GET | `/v1/courses/:courseId/modules` | JWT | List modules in a course |
| POST | `/v1/courses/:courseId/modules` | JWT + instructor/admin | Create module |
| PATCH | `/v1/modules/:id` | JWT + instructor/admin | Update module |
| DELETE | `/v1/modules/:id` | JWT + instructor/admin | Delete module |
| GET | `/v1/modules/:moduleId/lessons` | JWT | List lessons in a module |
| POST | `/v1/modules/:moduleId/lessons` | JWT + instructor/admin | Create lesson |
| PATCH | `/v1/lessons/:id` | JWT + instructor/admin | Update lesson |
| DELETE | `/v1/lessons/:id` | JWT + instructor/admin | Delete lesson |

### Users and admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/users/:id` | Optional | Retrieve user profile |
| GET | `/v1/users/:id/token-balance` | JWT | Get BST token balance |
| PATCH | `/v1/users/:id` | JWT | Update own user profile |
| GET | `/v1/admin/users` | JWT + admin | List users with filters |
| PATCH | `/v1/admin/users/:id/role` | JWT + admin | Change user role |
| PATCH | `/v1/admin/users/:id/ban` | JWT + admin | Ban or unban user |
| DELETE | `/v1/admin/users/:id` | JWT + admin | Soft delete user |
| GET | `/v1/users/admin-only` | JWT + admin | Health check for admin permissions |

### Enrollment and progress

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/courses/:id/enroll` | JWT | Enroll signed-in user in course |
| DELETE | `/v1/courses/:id/enroll` | JWT | Unenroll from course |
| GET | `/v1/users/:id/enrollments` | JWT | List user enrollments |
| POST | `/v1/progress` | JWT | Record lesson progress |
| GET | `/v1/users/:id/progress` | JWT | Retrieve user progress |

### Stellar & credentials

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/stellar/network-status` | Optional | Check Stellar network status |
| GET | `/v1/stellar/balance/:publicKey` | Optional | Fetch Stellar account balances |
| POST | `/v1/stellar/mint` | JWT + admin | Mint a Stellar credential NFT |
| GET | `/v1/credentials/:userId` | JWT | List credentials for user |
| GET | `/v1/credentials/verify/:txHash` | JWT | Verify credential transaction |
| POST | `/v1/credentials/issue` | JWT + admin | Issue a course completion credential |

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/notifications` | JWT | List notifications |
| PATCH | `/v1/notifications/:id/read` | JWT | Mark one notification read |
| PATCH | `/v1/notifications/read-all` | JWT | Mark all notifications read |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/v1/health` | Optional | API health/status endpoint |

## Request and Response Examples

### Course listing

```bash
curl -X GET http://localhost:3000/v1/courses?search=stellar&level=beginner&page=1&limit=10
```

Example response:

```json
{
  "data": [
    {
      "id": "course-123",
      "title": "Intro to Stellar",
      "description": "Learn blockchain fundamentals with Stellar.",
      "level": "beginner"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Enroll in a course

```bash
curl -X POST http://localhost:3000/v1/courses/course-123/enroll \
  -H "Authorization: Bearer <access_token>"
```

Example response:

```json
{
  "data": {
    "courseId": "course-123",
    "userId": "user-456",
    "enrolledAt": "2026-05-29T00:00:00.000Z"
  },
  "statusCode": 201,
  "timestamp": "2026-05-29T00:00:00.000Z"
}
```

### Mint credential (admin)

```bash
curl -X POST http://localhost:3000/v1/stellar/mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"recipientPublicKey":"GABCD...","courseId":"course-123"}'
```

Example response:

```json
{
  "data": "transaction_hash_123",
  "statusCode": 201,
  "timestamp": "2026-05-29T00:00:00.000Z"
}
```

### API response envelope

Most endpoints return a response envelope that includes metadata and the payload in `data`:

```json
{
  "data": { ... },
  "statusCode": 200,
  "timestamp": "2026-05-29T00:00:00.000Z"
}
```

## Error Code Reference

| HTTP Status | Meaning | When to use |
|---|---|---|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created or action accepted |
| 400 | Bad Request | Validation failure or malformed payload |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource or conflict state |
| 429 | Too Many Requests | Request throttled or rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Common error response example

```json
{
  "statusCode": 400,
  "message": "Validation failed: password must be at least 8 characters",
  "error": "Bad Request"
}
```

## Best Practices

- Always use `/v1` prefix when calling the API.
- For protected endpoints, set `Authorization: Bearer <token>`.
- Use the interactive explorer at `/api/docs` to test requests and inspect schemas.
- Refer to `docs/api/CHANGELOG.md` for API updates and version notes.

## Changelog

The API changelog is maintained in `docs/api/CHANGELOG.md`.

## Static documentation deployment

The project includes a static Swagger UI in `docs/api/swagger-ui.html` and a generated OpenAPI spec at `docs/api/dist/openapi.json` when exported.
