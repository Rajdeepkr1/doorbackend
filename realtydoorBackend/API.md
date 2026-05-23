# RealtyDoor API Reference

**Base URL:** `https://api.realtydoor.com/api`  
**Version:** 1.0 (MVP)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Rate Limits](#rate-limits)
6. [Auth (Login Sync)](#auth-login-sync)
    - POST /api/auth/sync
    - GET /api/auth/me
    - POST /api/auth/set-role
7. [Properties](#properties)
    - POST /api/properties/:id/images
8. [Leads](#leads)
9. [Users (Dashboard)](#users-dashboard)
    - POST /api/user/verify-phone/otp
10. [Partners](#partners)
    - GET /api/partner/listings/:id
11. [Admin](#admin)
    - [User Management](#get-apiadminusers)
12. [Escrow](#escrow)
13. [Services](#services)
14. [CMS / Blog](#cms--blog)
15. [Notifications](#notifications)
16. [Contact](#contact)
17. [Webhooks](#webhooks)

---

## Overview

### Role Hierarchy

| Role | Description |
|---|---|
| `USER` | Buyers, tenants, NRI investors |
| `PARTNER` | Agents, builders, advisors (requires KYC) |
| `ADMIN` | Platform owner — full access |

### Auth Levels Used in This Doc

- **Public** — No token required
- **Auth** — Any authenticated user (USER / PARTNER / ADMIN)
- **User** — `role: USER` or above
- **Partner** — `role: PARTNER` or above + `kycStatus: VERIFIED`
- **Admin** — `role: ADMIN` only

---

## Authentication

All protected routes require a **Clerk JWT** in the Authorization header.

```
Authorization: Bearer <clerk_session_token>
```

Tokens are obtained from the Clerk frontend SDK (`useAuth().getToken()`).

---

## Response Format

### Success

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

### Paginated Success

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [ ... ],
    "pagination": {
      "total": 120,
      "page": 1,
      "limit": 20,
      "totalPages": 6,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Human-readable error message",
  "data": { "code": "PHONE_NOT_VERIFIED" }
}
```

---

## Error Codes

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Missing or invalid token |
| `403` | Insufficient permissions / KYC not verified / phone not verified |
| `404` | Resource not found |
| `409` | Conflict (duplicate entry) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

### Special `data.code` Values

| Code | Trigger |
|---|---|
| `PHONE_NOT_VERIFIED` | Action requires phone verification |

---

## Rate Limits

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| Default | 15 min | 100 | All routes |
| OTP | 1 hour | 5 | `/leads/*/verify-otp`, `/user/verify-phone` |
| Auth | 15 min | 20 | Auth-related routes |
| Upload | 1 hour | 50 | File upload routes |

---

## Auth (Login Sync)

These two endpoints are called by the Next.js frontend on every login and page load. They handle the gap between Clerk (identity) and MongoDB (platform data).

### POST `/api/auth/sync`

Call this **immediately after every Clerk login**. Fetches the full Clerk profile, upserts the MongoDB user record with the latest data, and returns the complete profile.

**Auth:** Clerk JWT in `Authorization: Bearer` header (no `authenticate` middleware — verifies the token internally)

**Request:** No body required. JWT is read from the `Authorization` header.

**What it syncs from Clerk:**

| Field | Source |
|---|---|
| `name` | `firstName + lastName` |
| `email` | Primary email address |
| `phone` | Primary phone number (if added in Clerk) |
| `profileImageUrl` | `imageUrl` |
| `role` | `publicMetadata.role` (set by admin or on first signup) |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "666bbb111ccc222ddd333eee",
    "clerkId": "user_2abc123def456",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "+919876543210",
    "phoneVerified": false,
    "role": "USER",
    "isNRI": false,
    "profileImageUrl": "https://img.clerk.com/avatar.jpg",
    "partnerSubType": null,
    "companyName": null,
    "bio": null,
    "websiteUrl": null,
    "kycStatus": "NOT_SUBMITTED",
    "kycVerifiedAt": null,
    "kycRejectionNote": null,
    "createdAt": "2026-05-19T10:00:00.000Z",
    "updatedAt": "2026-05-19T10:00:00.000Z"
  }
}
```

**Side Effects:**
- Upserts the `User` record in MongoDB with latest Clerk data
- If `publicMetadata.role` is missing in Clerk, stamps it with the resolved role (default: `USER`)

**Errors:**

| Status | Message |
|---|---|
| `401` | Invalid or expired token |

---

### GET `/api/auth/me`

Returns the full platform profile for the currently authenticated user. Includes unread notification count and active subscription summary. Works for all roles.

**Auth:** Auth (any role)

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "666bbb111ccc222ddd333eee",
    "clerkId": "user_2abc123def456",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "phone": "+919876543210",
    "phoneVerified": true,
    "role": "USER",
    "isNRI": false,
    "profileImageUrl": "https://img.clerk.com/avatar.jpg",
    "partnerSubType": null,
    "companyName": null,
    "bio": null,
    "websiteUrl": null,
    "kycStatus": "NOT_SUBMITTED",
    "kycVerifiedAt": null,
    "kycRejectionNote": null,
    "createdAt": "2026-05-19T10:00:00.000Z",
    "updatedAt": "2026-05-19T10:00:00.000Z",
    "unreadNotifications": 3,
    "activeSubscription": null
  }
}
```

For a **PARTNER** user, role-specific fields are also populated:

```json
{
  "role": "PARTNER",
  "partnerSubType": "AGENT",
  "companyName": "Ravi Properties Pvt Ltd",
  "bio": "8 years in Whitefield and Sarjapur.",
  "websiteUrl": "https://ravirealty.com",
  "kycStatus": "VERIFIED",
  "kycVerifiedAt": "2026-04-20T10:00:00.000Z",
  "activeSubscription": {
    "plan": "PRO",
    "paymentStatus": "SUCCESS",
    "expiresAt": "2027-04-20T00:00:00.000Z"
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `401` | No token provided |
| `404` | User not found |

---

### POST `/api/auth/set-role`

Self-service role upgrade — allows a newly signed-up user to promote themselves from `USER` to `PARTNER`. Called by the auth callback page when the user signed up with partner intent.

**Auth:** Auth (any role)

**Request Body:**

```json
{
  "role": "PARTNER"
}
```

> Only `"PARTNER"` is accepted. Requesting `"ADMIN"` returns `400`. The operation is idempotent — if the user is already `PARTNER` or `ADMIN`, the current role is returned unchanged.

**Response `200`:**

```json
{
  "success": true,
  "data": { "role": "PARTNER" }
}
```

**Side Effects:**
- Updates `User.role` in MongoDB
- Stamps `publicMetadata.role = 'PARTNER'` in Clerk via the Clerk Management API (best-effort; DB update succeeds even if Clerk API call fails)

**Errors:**

| Status | Message |
|---|---|
| `400` | Only PARTNER role can be self-assigned |
| `401` | Not authenticated |

---

### Frontend Usage (Next.js)

```js
// 1. After every Clerk login — call sync to upsert DB profile
const { getToken } = useAuth();

useEffect(() => {
  async function onLogin() {
    const token = await getToken();  // or getToken({ template: 'realtydoor' })
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}, []);

// 2. On any page — get full profile (role, kycStatus, etc.)
const { data } = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${await getToken()}` },
});
// data.role === 'USER' | 'PARTNER' | 'ADMIN'
```

---

## Properties

### GET `/api/properties`

Search and filter properties.

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Full-text search on title, description, locality |
| `city` | string | Exact match, case-insensitive (e.g. `Bangalore`) |
| `locality` | string | Partial match (e.g. `Whitefield`) |
| `propertyType` | string | `FLAT` \| `INDEPENDENT_HOUSE` \| `VILLA` \| `PLOT` \| `COMMERCIAL_OFFICE` \| `RETAIL_SHOP` |
| `listingType` | string | `SALE` \| `RENT` \| `LEASE` |
| `bhk` | number | Exact BHK count |
| `minPrice` | number | Min price in rupees (absolute) |
| `maxPrice` | number | Max price in rupees |
| `minArea` | number | Min carpet area in sq.ft |
| `maxArea` | number | Max carpet area in sq.ft |
| `furnishing` | string | `FULLY_FURNISHED` \| `SEMI_FURNISHED` \| `UNFURNISHED` |
| `propertyStatus` | string | `READY_TO_MOVE` \| `UNDER_CONSTRUCTION` |
| `isVerified` | boolean | Only RealtyDoor Verified listings |
| `amenities` | string | Comma-separated list — AND logic (e.g. `Power Backup,Gym`) |
| `sort` | string | `price_asc` \| `price_desc` \| `newest` \| `area_asc` |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20, Max: 50 |

> Only `publishStatus: APPROVED` and `isB2BOnly: false` listings are returned — always enforced.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "664abc123def456789012345",
        "title": "Spacious 2BHK in Whitefield",
        "slug": "spacious-2bhk-whitefield-1717000000000",
        "price": 5500000,
        "monthlyRent": null,
        "propertyType": "FLAT",
        "listingType": "SALE",
        "propertyStatus": "READY_TO_MOVE",
        "bhk": 2,
        "carpetArea": 950,
        "locality": "Whitefield",
        "city": "Bangalore",
        "images": ["https://res.cloudinary.com/..."],
        "coverImageIndex": 0,
        "isVerified": true,
        "isFeatured": false,
        "reraNumber": "PRM/KA/RERA/1251/446/PR/171015/000015",
        "createdAt": "2026-05-01T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 45, "page": 1, "limit": 20, "totalPages": 3, "hasNext": true, "hasPrev": false }
  }
}
```

---

### GET `/api/properties/featured`

Returns up to 12 admin-featured listings.

**Auth:** Public

**Response `200`:** Same shape as search results (no pagination wrapper).

---

### GET `/api/properties/:slug`

Full property detail for a single listing.

**Auth:** Public

**Path Params:**

| Param | Description |
|---|---|
| `slug` | Unique property slug (e.g. `spacious-2bhk-whitefield-1717000000000`) |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "664abc123def456789012345",
    "title": "Spacious 2BHK in Whitefield",
    "slug": "spacious-2bhk-whitefield-1717000000000",
    "description": "Well-ventilated 2BHK...",
    "price": 5500000,
    "propertyType": "FLAT",
    "listingType": "SALE",
    "propertyStatus": "READY_TO_MOVE",
    "publishStatus": "APPROVED",
    "bhk": 2,
    "bathrooms": 2,
    "carpetArea": 950,
    "builtUpArea": 1100,
    "floorNumber": 4,
    "totalFloors": 12,
    "furnishing": "SEMI_FURNISHED",
    "facing": "East",
    "address": "Brigade Gateway, Whitefield",
    "locality": "Whitefield",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560066",
    "latitude": 12.9698,
    "longitude": 77.7499,
    "nearbyLandmarks": ["ITPL - 1.2km", "Phoenix Mall - 3km"],
    "isVerified": true,
    "reraNumber": "PRM/KA/RERA/...",
    "bankApprovals": ["HDFC", "SBI"],
    "images": ["https://res.cloudinary.com/..."],
    "amenities": ["Power Backup", "Gym", "Swimming Pool"],
    "partner": {
      "companyName": "Ravi Properties Pvt Ltd",
      "partnerSubType": "AGENT"
    },
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-10T08:30:00.000Z"
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `404` | Property not found |

---

### POST `/api/properties`

Submit a new property listing for Admin approval.

**Auth:** Partner (KYC Verified)

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "title": "Spacious 2BHK in Whitefield",
  "description": "Well-ventilated 2BHK flat with great amenities...",
  "price": 5500000,
  "propertyType": "FLAT",
  "listingType": "SALE",
  "propertyStatus": "READY_TO_MOVE",
  "bhk": 2,
  "bathrooms": 2,
  "carpetArea": 950,
  "builtUpArea": 1100,
  "floorNumber": 4,
  "totalFloors": 12,
  "furnishing": "SEMI_FURNISHED",
  "facing": "East",
  "address": "Brigade Gateway, Whitefield",
  "locality": "Whitefield",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560066",
  "latitude": 12.9698,
  "longitude": 77.7499,
  "reraNumber": "PRM/KA/RERA/...",
  "amenities": ["Power Backup", "Gym"],
  "bankApprovals": ["HDFC"]
}
```

**Required fields:** `title`, `description`, `propertyType`, `listingType`, `address`, `locality`, `city`, `state`, `pincode`

**Response `201`:**

```json
{
  "success": true,
  "message": "Listing submitted for review",
  "data": {
    "id": "664abc123def456789012345",
    "slug": "spacious-2bhk-whitefield-1717000000000",
    "publishStatus": "PENDING_APPROVAL"
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `400` | Validation error |
| `401` | Not authenticated |
| `403` | KYC verification required |

---

### PATCH `/api/properties/:id`

Edit an existing listing (Partner can only edit their own; `publishStatus` cannot be changed).

**Auth:** Partner (KYC Verified)

**Request Body:** Any subset of the `POST /api/properties` fields (partial update).

**Response `200`:** Updated property object.

**Errors:**

| Status | Message |
|---|---|
| `403` | Not your listing |
| `404` | Property not found |

---

### POST `/api/properties/:id/images`

Upload additional images for an existing listing. Images are appended to the existing `images` array.

**Auth:** Partner (KYC Verified)

**Content-Type:** `multipart/form-data`

**Rate Limit:** Upload limiter (50/hour)

**Form Fields:**

| Field | Type | Description |
|---|---|---|
| `images` | file[] | Up to 10 images (jpg/png/webp, max 10MB each) |

**Response `200`:**

```json
{
  "success": true,
  "message": "Images uploaded",
  "data": {
    "id": "664abc123def456789012345",
    "images": [
      "https://res.cloudinary.com/existing-image.jpg",
      "https://res.cloudinary.com/new-image.jpg"
    ]
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `400` | No images provided |
| `403` | Not your listing |
| `404` | Property not found |

---

## Leads

### POST `/api/leads`

Submit a buyer inquiry for a property.

**Auth:** User (phone verified)

> Phone verification is required. If `phoneVerified: false`, returns `403` with `data.code: "PHONE_NOT_VERIFIED"`.

**Request Body:**

```json
{
  "propertyId": "664abc123def456789012345",
  "buyerName": "Priya Sharma",
  "buyerEmail": "priya@example.com",
  "buyerPhone": "+919876543210",
  "buyerMessage": "I am interested in this property. Can we schedule a visit?"
}
```

**Validation:**
- `buyerPhone`: Must be `+91XXXXXXXXXX` format (Indian mobile)
- `buyerMessage`: Max 500 characters

**Response `201`:**

```json
{
  "success": true,
  "message": "We'll reach out within 24 hours",
  "data": {
    "id": "665def456abc789012345678",
    "status": "UNASSIGNED",
    "propertyId": "664abc123def456789012345",
    "buyerName": "Priya Sharma",
    "createdAt": "2026-05-19T10:00:00.000Z"
  }
}
```

**Side Effects:**
- Creates `Notification` for all Admin users: "New Unassigned Lead"

**Errors:**

| Status | Message |
|---|---|
| `400` | Validation error |
| `403` | Phone verification required |

---

### GET `/api/leads/partner`

Get all leads assigned to the authenticated partner.

**Auth:** Partner (KYC Verified)

> Returns `buyerPhone` masked as `+91 98765 XXXXX` until `isOtpVerified: true`.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "665def456abc789012345678",
      "buyerName": "Priya Sharma",
      "buyerEmail": "priya@example.com",
      "buyerPhone": "+91 98765 XXXXX",
      "status": "ASSIGNED",
      "isOtpVerified": false,
      "siteVisitScheduledAt": null,
      "property": {
        "title": "Spacious 2BHK in Whitefield",
        "slug": "spacious-2bhk-whitefield-1717000000000",
        "locality": "Whitefield",
        "city": "Bangalore"
      },
      "createdAt": "2026-05-19T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/leads/partner/:id`

Get full details of a single assigned lead.

**Auth:** Partner (KYC Verified)

**Path Params:** `id` — Lead ID

**Response `200`:** Full lead object with property details. Phone is masked if `isOtpVerified: false`.

**Errors:**

| Status | Message |
|---|---|
| `404` | Lead not found (or not assigned to this partner) |

---

### POST `/api/leads/partner/:id/schedule-visit`

Schedule a site visit. Generates OTP and sends it to buyer via WhatsApp (WATI).

**Auth:** Partner (KYC Verified)

**Rate Limit:** Default

**Request Body:**

```json
{
  "scheduledAt": "2026-05-25T10:00:00.000Z"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "message": "OTP sent to buyer via WhatsApp. Enter it at the site."
  }
}
```

**Side Effects:**
- Sets `lead.status = "SITE_VISIT_SCHEDULED"`
- Generates 4-digit OTP, stores encrypted in DB
- OTP expires after 120 minutes
- Sends WhatsApp template `site_visit_otp` to buyer via WATI

**Errors:**

| Status | Message |
|---|---|
| `400` | Cannot schedule visit on a closed lead |
| `404` | Lead not found |

---

### POST `/api/leads/partner/:id/verify-otp`

Verify the site visit OTP at the property. Reveals buyer's full phone number on success.

**Auth:** Partner (KYC Verified)

**Rate Limit:** OTP limiter (5 requests/hour)

**Request Body:**

```json
{
  "otp": "7342"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "message": "OTP verified. Buyer contact revealed.",
    "buyerPhone": "+919876543210"
  }
}
```

**Side Effects:**
- Sets `lead.isOtpVerified = true`, `lead.status = "SITE_VISIT_DONE"`
- Clears OTP from database
- After 24h, `whatsappFeedback` job sends buyer feedback request

**Errors:**

| Status | Message |
|---|---|
| `400` | Incorrect OTP — `X attempt(s) remaining` |
| `400` | OTP has expired |
| `400` | No OTP generated for this lead |
| `429` | Maximum OTP attempts reached. Contact Admin. |

---

### PATCH `/api/leads/partner/:id/document`

Upload visit photos and/or closure documents.

**Auth:** Partner (KYC Verified)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Description |
|---|---|---|
| `visitPhotos` | file[] | Up to 10 visit photos (jpg/png/webp, max 10MB each) |
| `closureDocs` | file[] | Up to 5 closure documents (jpg/png/pdf, max 10MB each) |
| `visitNotes` | string | Text notes from the visit (max 1000 chars) |
| `partnerNotes` | string | Internal partner notes (max 1000 chars) |

**Response `200`:**

```json
{
  "success": true,
  "message": "Documentation uploaded",
  "data": {
    "id": "665def456abc789012345678",
    "visitPhotoUrls": ["https://res.cloudinary.com/..."],
    "closureDocumentUrls": [],
    "visitNotes": "Buyer liked the property. Wants to negotiate on price."
  }
}
```

---

### PATCH `/api/leads/partner/:id/close`

Mark a lead as closed (deal done).

**Auth:** Partner (KYC Verified)

> **Requires** an `EscrowTransaction { status: HELD }` to exist for this lead. Closing without escrow is blocked (PRD Rule 6).

> This action is **irreversible** for partners (PRD Rule 7). Admin can reopen.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "message": "Lead marked as closed. Admin will review escrow release."
  }
}
```

**Side Effects:**
- Creates `Notification` for all Admin: "Deal Closed — Escrow Review Needed"

**Errors:**

| Status | Message |
|---|---|
| `400` | Escrow payment required before closing a deal |
| `400` | Lead is already closed |
| `404` | Lead not found |

---

## Users (Dashboard)

All routes under `/api/user` require authentication (`role: USER` or above).

---

### POST `/api/user/verify-phone`

Request a phone verification OTP via WhatsApp.

**Auth:** Auth (any role)

**Rate Limit:** OTP limiter (5/hour)

**Request Body:**

```json
{
  "phone": "+919876543210"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": { "message": "OTP sent via WhatsApp" }
}
```

**Errors:**

| Status | Message |
|---|---|
| `409` | Phone number already in use |

---

### POST `/api/user/verify-phone/otp`

Submit the OTP received via WhatsApp to verify the phone number.

**Auth:** Auth (any role)

**Rate Limit:** OTP limiter (5/hour)

**Request Body:**

```json
{
  "otp": "482951"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Phone number verified",
  "data": { "phoneVerified": true }
}
```

**Errors:**

| Status | Message |
|---|---|
| `400` | Incorrect OTP |
| `400` | OTP has expired |
| `400` | No OTP pending for this user |
| `429` | Rate limit exceeded |

---

### GET `/api/user/leads`

Get all inquiries submitted by the authenticated user, with status tracking.

**Auth:** User

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "665def456abc789012345678",
      "status": "SITE_VISIT_DONE",
      "buyerMessage": "I am interested in this property.",
      "property": {
        "title": "Spacious 2BHK in Whitefield",
        "slug": "spacious-2bhk-whitefield-1717000000000",
        "city": "Bangalore",
        "images": ["https://res.cloudinary.com/..."]
      },
      "createdAt": "2026-05-10T10:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/user/favorites`

Save or unsave a property (toggles).

**Auth:** User (phone verified)

**Request Body:**

```json
{
  "propertyId": "664abc123def456789012345"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": { "favorited": true }
}
```

---

### GET `/api/user/documents`

List all KYC/loan documents uploaded by the user.

**Auth:** User

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "666aaa111bbb222ccc333ddd",
      "documentType": "PAN_CARD",
      "fileName": "pan_card.pdf",
      "fileUrl": "https://res.cloudinary.com/...",
      "isVerified": false,
      "uploadedAt": "2026-05-15T08:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/user/documents`

Upload a KYC or loan document.

**Auth:** User (phone verified)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | jpg/png/pdf, max 10MB |
| `documentType` | string | Yes | `PAN_CARD` \| `AADHAR` \| `SALARY_SLIP` \| `FORM_16` \| `BANK_STATEMENT` |

**Response `201`:**

```json
{
  "success": true,
  "message": "Document uploaded",
  "data": {
    "id": "666aaa111bbb222ccc333ddd",
    "documentType": "PAN_CARD",
    "fileName": "pan_card.pdf",
    "fileUrl": "https://res.cloudinary.com/...",
    "isVerified": false
  }
}
```

---

### GET `/api/user/subscriptions`

Get all service subscriptions and their tickets.

**Auth:** User

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "667bbb222ccc333ddd444eee",
      "serviceId": "668ccc333ddd444eee555fff",
      "paymentStatus": "SUCCESS",
      "amountPaid": 5999,
      "startDate": "2026-05-01T00:00:00.000Z",
      "endDate": "2027-05-01T00:00:00.000Z",
      "tickets": [
        {
          "id": "669ddd444eee555fff666aaa",
          "subject": "Bathroom tap broken",
          "status": "RESOLVED",
          "createdAt": "2026-05-10T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### POST `/api/user/tickets`

Raise a new service ticket.

**Auth:** User (phone verified)

**Request Body:**

```json
{
  "subscriptionId": "667bbb222ccc333ddd444eee",
  "subject": "Bathroom tap broken",
  "description": "The cold water tap in the master bathroom has been dripping for 3 days.",
  "category": "PLUMBING"
}
```

**Valid categories:** `PLUMBING` | `ELECTRICAL` | `PAINTING` | `GENERAL`

**Response `201`:**

```json
{
  "success": true,
  "message": "Ticket raised",
  "data": {
    "id": "669ddd444eee555fff666aaa",
    "subject": "Bathroom tap broken",
    "status": "OPEN",
    "priority": "NORMAL",
    "createdAt": "2026-05-19T10:00:00.000Z"
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `400` | Service not active (payment not successful) |
| `404` | Subscription not found |

---

### PATCH `/api/user/tickets/:id/verify`

Mark a resolved ticket as verified (closes it permanently).

**Auth:** User

**Path Params:** `id` — Ticket ID

**Response `200`:**

```json
{
  "success": true,
  "message": "Ticket verified and closed",
  "data": {
    "id": "669ddd444eee555fff666aaa",
    "status": "VERIFIED_BY_USER",
    "verifiedAt": "2026-05-20T14:00:00.000Z"
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `400` | Ticket is not yet resolved |
| `404` | Ticket not found |

---

## Partners

All routes under `/api/partner` require `role: PARTNER` or `ADMIN`.

---

### POST `/api/partner/kyc`

Submit KYC documents for admin review.

**Auth:** Partner (any KYC status)

**Content-Type:** `multipart/form-data`

**Rate Limit:** Upload limiter (50/hour)

**Form Fields:**

| Field | Type | Description |
|---|---|---|
| `documents` | file[] | Up to 5 files — RERA certificate, Aadhar, Business PAN (jpg/png/pdf, 10MB each) |

**Response `200`:**

```json
{
  "success": true,
  "message": "KYC submitted for review. Usually verified within 24 hours.",
  "data": {
    "kycStatus": "PENDING_REVIEW",
    "kycDocumentUrls": ["https://res.cloudinary.com/..."]
  }
}
```

**Side Effects:**
- Creates `Notification` for all Admin: "New KYC Pending Review"

**Errors:**

| Status | Message |
|---|---|
| `400` | KYC already verified |

---

### GET `/api/partner/profile`

Get the authenticated partner's profile.

**Auth:** Partner

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "664aaa000bbb111ccc222ddd",
    "name": "Ravi Kumar",
    "email": "ravi@ravirealty.com",
    "phone": "+919876500000",
    "companyName": "Ravi Properties Pvt Ltd",
    "partnerSubType": "AGENT",
    "bio": "8 years experience in Whitefield and Sarjapur.",
    "kycStatus": "VERIFIED",
    "kycVerifiedAt": "2026-04-20T10:00:00.000Z",
    "createdAt": "2026-04-15T08:00:00.000Z"
  }
}
```

---

### PATCH `/api/partner/profile`

Update partner profile fields.

**Auth:** Partner

**Request Body:** (all optional)

```json
{
  "name": "Ravi Kumar",
  "companyName": "Ravi Properties Pvt Ltd",
  "bio": "Updated bio text.",
  "websiteUrl": "https://ravirealty.com",
  "phone": "+919876500001"
}
```

> Fields `role`, `kycStatus`, `kycDocumentUrls`, and `email` are silently ignored.

**Response `200`:** Updated profile object.

---

### GET `/api/partner/listings`

Get all listings submitted by the authenticated partner.

**Auth:** Partner (KYC Verified)

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by `publishStatus`: `PENDING_APPROVAL` \| `APPROVED` \| `REJECTED` \| `ARCHIVED` |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "664abc123def456789012345",
      "title": "Spacious 2BHK in Whitefield",
      "slug": "spacious-2bhk-whitefield-1717000000000",
      "publishStatus": "APPROVED",
      "rejectionNote": null,
      "propertyType": "FLAT",
      "listingType": "SALE",
      "city": "Bangalore",
      "locality": "Whitefield",
      "price": 5500000,
      "bhk": 2,
      "createdAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/partner/listings/:id`

Get the full details of a single listing owned by the authenticated partner. Used to pre-populate the edit listing form.

**Auth:** Partner (KYC Verified)

**Path Params:** `id` — Property ID

**Response `200`:** Full property object (same shape as `GET /api/properties/:slug` but scoped to this partner and returns all fields including `publishStatus`, `rejectionNote`, and internal admin fields).

**Errors:**

| Status | Message |
|---|---|
| `404` | Listing not found (or not owned by this partner) |

---

### GET `/api/partner/finance`

Get deal closure and escrow summary for the partner.

**Auth:** Partner (KYC Verified)

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "totalLeads": 12,
    "closedDeals": 3,
    "escrowHeld": 300000
  }
}
```

---

## Admin

All routes under `/api/admin` require `role: ADMIN`.

---

### GET `/api/admin/leads`

Get all leads platform-wide with optional filters.

**Auth:** Admin

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by `LeadStatus` |
| `partnerId` | string | Filter by assigned partner |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Response `200`:** Paginated list of all leads with property and partner details.

---

### PATCH `/api/admin/leads/:id/assign`

Assign an unassigned lead to a partner.

**Auth:** Admin

**Request Body:**

```json
{
  "partnerId": "664aaa000bbb111ccc222ddd"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Lead assigned",
  "data": {
    "id": "665def456abc789012345678",
    "status": "ASSIGNED",
    "assignedPartnerId": "664aaa000bbb111ccc222ddd",
    "assignedAt": "2026-05-19T11:00:00.000Z"
  }
}
```

**Side Effects:**
- Creates `Notification` for partner: "New Lead Assigned"
- Creates `AuditLog`: `LEAD_ASSIGNED`
- Sends WhatsApp notice to partner (best-effort)

**Errors:**

| Status | Message |
|---|---|
| `400` | Partner not found or not KYC verified |
| `404` | Lead not found |

---

### GET `/api/admin/properties`

Get all properties pending approval.

**Auth:** Admin

**Query Parameters:** `page`, `limit`

**Response `200`:** Paginated list of properties with `publishStatus: PENDING_APPROVAL`, including partner details.

---

### PATCH `/api/admin/properties/:id/approve`

Approve a pending property listing.

**Auth:** Admin

**Response `200`:**

```json
{
  "success": true,
  "message": "Property approved",
  "data": {
    "id": "664abc123def456789012345",
    "publishStatus": "APPROVED"
  }
}
```

**Side Effects:**
- Creates `Notification` for partner: "Listing Approved!"
- Creates `AuditLog`: `PROPERTY_APPROVED`
- Sends approval email to partner

---

### PATCH `/api/admin/properties/:id/reject`

Reject a property listing with a note.

**Auth:** Admin

**Request Body:**

```json
{
  "note": "Cover photo is blurry. Please reupload with a clear exterior shot."
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Property rejected",
  "data": {
    "id": "664abc123def456789012345",
    "publishStatus": "REJECTED",
    "rejectionNote": "Cover photo is blurry..."
  }
}
```

**Side Effects:**
- Creates `Notification` for partner: "Listing Needs Changes"
- Creates `AuditLog`: `PROPERTY_REJECTED`
- Sends rejection email to partner

---

### GET `/api/admin/kyc`

Get all pending KYC submissions.

**Auth:** Admin

**Query Parameters:** `page`, `limit`

**Response `200`:** Paginated list of partners with `kycStatus: PENDING_REVIEW`.

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "664aaa000bbb111ccc222ddd",
        "name": "Ravi Kumar",
        "email": "ravi@ravirealty.com",
        "companyName": "Ravi Properties Pvt Ltd",
        "partnerSubType": "AGENT",
        "kycDocumentUrls": ["https://res.cloudinary.com/..."],
        "createdAt": "2026-04-15T08:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### PATCH `/api/admin/kyc/:userId/verify`

Approve or reject a KYC submission.

**Auth:** Admin

**Request Body:**

```json
{
  "action": "APPROVE",
  "note": ""
}
```

Or for rejection:

```json
{
  "action": "REJECT",
  "note": "RERA certificate appears expired. Resubmit with a valid certificate."
}
```

**`action`:** `"APPROVE"` | `"REJECT"`

**Response `200`:**

```json
{
  "success": true,
  "message": "KYC approved"
}
```

**Side Effects:**
- Creates `Notification` for partner
- Creates `AuditLog`: `KYC_APPROVE` or `KYC_REJECT`
- Sends verification email to partner (on approve)

---

### GET `/api/admin/revenue`

Revenue dashboard — month-to-date summary.

**Auth:** Admin

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "escrowHeld": {
      "amount": 2500000,
      "count": 8
    },
    "escrowReleasedMTD": {
      "amount": 1200000,
      "count": 4
    },
    "serviceRevenueMTD": {
      "amount": 89985,
      "count": 15
    },
    "closedLeadsMTD": 4,
    "totalLeads": 124
  }
}
```

---

### GET `/api/admin/audit-logs`

Full audit trail of all admin actions.

**Auth:** Admin

**Query Parameters:** `page`, `limit`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "66aaaa000bbb111ccc222ddd",
        "adminId": "664admin000bbb111ccc222",
        "action": "LEAD_ASSIGNED",
        "targetType": "Lead",
        "targetId": "665def456abc789012345678",
        "before": "{\"status\":\"UNASSIGNED\"}",
        "after": "{\"status\":\"ASSIGNED\",\"assignedPartnerId\":\"664aaa...\"}",
        "ipAddress": "103.58.12.44",
        "createdAt": "2026-05-19T11:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET `/api/admin/partners`

Performance metrics for all verified partners.

**Auth:** Admin

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "664aaa000bbb111ccc222ddd",
      "name": "Ravi Kumar",
      "companyName": "Ravi Properties Pvt Ltd",
      "partnerSubType": "AGENT",
      "totalLeads": 12,
      "closedLeads": 3,
      "totalListings": 8,
      "activeListings": 6
    }
  ]
}
```

---

### PATCH `/api/admin/escrow/:id/release`

Release held escrow funds to seller's Razorpay account.

**Auth:** Admin

**Request Body:**

```json
{
  "sellerAccountId": "acc_xxxxxxxxxxxxxxxx",
  "partnerShare": 80000,
  "platformFee": 20000,
  "note": "Allocation letter verified. Releasing to builder."
}
```

| Field | Required | Description |
|---|---|---|
| `sellerAccountId` | No | Razorpay linked account ID. If omitted, escrow is marked released without triggering a Razorpay transfer (manual payout case). |
| `partnerShare` | No | Amount in rupees transferred to partner |
| `platformFee` | No | Platform commission in rupees |
| `note` | No | Admin note stored in `adminNote` field |

> `partnerShare`, `platformFee`, and `note` are concatenated into `adminNote` for audit trail storage.

**Response `200`:**

```json
{
  "success": true,
  "message": "Escrow released",
  "data": {
    "id": "66bbb111ccc222ddd333eee",
    "status": "RELEASED",
    "releasedAt": "2026-05-20T10:00:00.000Z"
  }
}
```

**Side Effects:**
- Calls Razorpay Route transfer API (only if `sellerAccountId` is provided)
- Creates `AuditLog`: `ESCROW_RELEASED`

**Errors:**

| Status | Message |
|---|---|
| `400` | Cannot release escrow with status `REFUNDED` |
| `400` | Payment not yet captured |
| `404` | Escrow not found |

---

### POST `/api/admin/escrow/:id/refund`

Refund held escrow to buyer (deal fell through).

**Auth:** Admin

**Response `200`:**

```json
{
  "success": true,
  "message": "Escrow refunded",
  "data": {
    "id": "66bbb111ccc222ddd333eee",
    "status": "REFUNDED",
    "refundedAt": "2026-05-20T10:30:00.000Z"
  }
}
```

**Side Effects:**
- Calls Razorpay refund API
- Creates `AuditLog`: `ESCROW_REFUNDED`
- Creates `Notification` for buyer: "Escrow Refunded"

---

### GET `/api/admin/escrow`

List all escrow transactions.

**Auth:** Admin

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | `HELD` \| `RELEASED` \| `REFUNDED` |
| `page` | number | Default: 1 |

**Response `200`:** Paginated list of `EscrowTransaction` records.

---

### POST `/api/admin/content`

Create a CMS content block (blog post, banner, testimonial, etc.).

**Auth:** Admin

**Request Body:**

```json
{
  "type": "BLOG",
  "title": "Top 5 localities in Bangalore for 2026",
  "slug": "top-5-localities-bangalore-2026",
  "content": "<p>Detailed article content here...</p>",
  "excerpt": "A quick guide to the best investment localities.",
  "author": "RealtyDoor Research",
  "tags": ["Bangalore", "Investment", "2026"],
  "isPublished": true,
  "seoTitle": "Top 5 Bangalore Localities 2026 | RealtyDoor",
  "seoDesc": "Discover the best localities to invest in Bangalore in 2026."
}
```

**Valid types:** `BLOG` | `FAQ` | `HERO_BANNER` | `TESTIMONIAL` | `ANNOUNCEMENT` | `STATS_BAR` | `NRI_GUIDE` | `TEAM_MEMBER`

**Response `201`:** Created content block.

---

### PATCH `/api/admin/content/:id`

Update an existing content block.

**Auth:** Admin

**Request Body:** Any subset of `POST /api/admin/content` fields.

**Response `200`:** Updated content block.

---

### DELETE `/api/admin/content/:id`

Delete a content block.

**Auth:** Admin

**Response `204`:** No content.

---

### POST `/api/admin/notifications/broadcast`

Send a notification to a group of users.

**Auth:** Admin

**Request Body:**

```json
{
  "roles": ["USER"],
  "title": "New Feature: Video Tours Now Live!",
  "message": "You can now request video tours from NRI-friendly listings.",
  "type": "ANNOUNCEMENT"
}
```

**`roles`:** Array of `USER` | `PARTNER` | `ADMIN`. Omit to send to all users.

**Response `200`:**

```json
{
  "success": true,
  "message": "Broadcast sent",
  "data": { "count": 1452 }
}
```

---

### GET `/api/admin/users`

List all platform users with optional filters.

**Auth:** Admin

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `role` | string | Filter by role: `USER` \| `PARTNER` \| `ADMIN` |
| `search` | string | Partial match on name or email |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "664aaa000bbb111ccc222ddd",
        "name": "Ravi Kumar",
        "email": "ravi@ravirealty.com",
        "phone": "+919876500000",
        "phoneVerified": true,
        "role": "PARTNER",
        "kycStatus": "VERIFIED",
        "partnerSubType": "AGENT",
        "createdAt": "2026-04-15T08:00:00.000Z"
      }
    ],
    "pagination": { "total": 240, "page": 1, "limit": 20, "totalPages": 12, "hasNext": true, "hasPrev": false }
  }
}
```

---

### PATCH `/api/admin/users/:id/role`

Promote or demote a user's role.

**Auth:** Admin

**Path Params:** `id` — User ID

**Request Body:**

```json
{
  "role": "PARTNER"
}
```

**`role`:** `"USER"` | `"PARTNER"` | `"ADMIN"`

**Response `200`:**

```json
{
  "success": true,
  "message": "Role updated to PARTNER",
  "data": {
    "id": "664aaa000bbb111ccc222ddd",
    "name": "Ravi Kumar",
    "email": "ravi@ravirealty.com",
    "role": "PARTNER"
  }
}
```

**Side Effects:**
- Creates `AuditLog`: `ROLE_CHANGED` with before/after role snapshot

**Errors:**

| Status | Message |
|---|---|
| `400` | Invalid role |
| `404` | User not found |

---

## Escrow

### POST `/api/escrow/create-order`

Create a Razorpay Route escrow order for a token advance payment.

**Auth:** User (phone verified)

**Request Body:**

```json
{
  "leadId": "665def456abc789012345678",
  "amount": 100000
}
```

**`amount`:** Token advance in rupees (e.g. `100000` = ₹1,00,000)

**Response `201`:**

```json
{
  "success": true,
  "message": "Escrow order created",
  "data": {
    "escrow": {
      "id": "66bbb111ccc222ddd333eee",
      "status": "HELD",
      "amount": 100000
    },
    "razorpayOrder": {
      "id": "order_xxxxxxxxxxx",
      "amount": 10000000,
      "currency": "INR"
    }
  }
}
```

> Use `razorpayOrder.id` to open the Razorpay checkout on the frontend.
> After payment, Razorpay fires the `payment.captured` webhook which automatically updates the escrow record.

**Errors:**

| Status | Message |
|---|---|
| `400` | Escrow already held for this lead |
| `404` | Lead not found |

---

## Services

### GET `/api/services`

List all active post-purchase services.

**Auth:** Public

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "668ccc333ddd444eee555fff",
      "name": "Annual Maintenance Plan",
      "shortDesc": "12 months of home maintenance coverage",
      "price": 5999,
      "category": "MAINTENANCE",
      "features": ["Plumbing", "Electrical", "Painting touch-up", "24h support"],
      "isActive": true,
      "sortOrder": 1,
      "imageUrl": "https://res.cloudinary.com/..."
    }
  ]
}
```

---

### POST `/api/services/create-order`

Create a Razorpay order for a service subscription purchase.

**Auth:** User (phone verified)

**Request Body:**

```json
{
  "serviceId": "668ccc333ddd444eee555fff"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "subscription": {
      "id": "667bbb222ccc333ddd444eee",
      "paymentStatus": "PENDING",
      "amountPaid": 5999
    },
    "razorpayOrder": {
      "id": "order_xxxxxxxxxxx",
      "amount": 599900,
      "currency": "INR"
    },
    "key": "rzp_live_xxxxxxxx"
  }
}
```

> After payment, the `payment.captured` webhook activates the subscription and creates the first service ticket.

**Errors:**

| Status | Message |
|---|---|
| `404` | Service not found or inactive |

---

## CMS / Blog

### GET `/api/blog`

Get published content blocks (blogs, testimonials, banners, etc.).

**Auth:** Public

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `type` | string | `BLOG` \| `TESTIMONIAL` \| `HERO_BANNER` \| `STATS_BAR` \| etc. |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Response `200`:** Paginated list of `ContentBlock` records where `isPublished: true`.

---

### GET `/api/blog/:slug`

Get a single published content block by slug.

**Auth:** Public

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "66ddd444eee555fff666aaa",
    "type": "BLOG",
    "title": "Top 5 localities in Bangalore for 2026",
    "slug": "top-5-localities-bangalore-2026",
    "content": "<p>Detailed article content...</p>",
    "excerpt": "A quick guide to the best investment localities.",
    "author": "RealtyDoor Research",
    "tags": ["Bangalore", "Investment"],
    "isPublished": true,
    "publishedAt": "2026-05-01T08:00:00.000Z",
    "seoTitle": "Top 5 Bangalore Localities 2026 | RealtyDoor",
    "seoDesc": "Discover the best localities..."
  }
}
```

**Errors:**

| Status | Message |
|---|---|
| `404` | Content not found |

---

## Notifications

All routes require authentication.

---

### GET `/api/notifications`

Get notifications for the authenticated user.

**Auth:** User (any role)

**Query Parameters:** `page`, `limit`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "66eee555fff666aaa777bbb",
        "title": "New Lead Assigned",
        "message": "A new buyer lead has been assigned to you.",
        "type": "LEAD_ASSIGNED",
        "isRead": false,
        "linkUrl": "/partner/leads/665def456abc789012345678",
        "createdAt": "2026-05-19T11:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### PATCH `/api/notifications/:id/read`

Mark a single notification as read.

**Auth:** User (any role)

**Response `200`:**

```json
{
  "success": true,
  "message": "Marked as read"
}
```

---

### PATCH `/api/notifications/read-all`

Mark all notifications as read.

**Auth:** User (any role)

**Response `200`:**

```json
{
  "success": true,
  "message": "All marked as read"
}
```

---

## Contact

### POST `/api/contact`

Submit a general contact form message.

**Auth:** Public (optionally authenticated)

**Rate Limit:** Default (100 req / 15 min)

**Request Body:**

```json
{
  "name": "Amit Verma",
  "email": "amit@example.com",
  "phone": "+919876500001",
  "subject": "Partnership Inquiry",
  "message": "I am interested in listing my properties on RealtyDoor. Please get in touch."
}
```

**Required fields:** `name`, `email`, `subject`, `message`

**Response `201`:**

```json
{
  "success": true,
  "message": "Message received. We will get back to you shortly.",
  "data": { "id": "66fff666aaa777bbb888ccc" }
}
```

---

## Webhooks

### POST `/api/webhooks/razorpay`

Receives signed webhook events from Razorpay.

**Auth:** Razorpay HMAC signature (header: `x-razorpay-signature`)

> Do **not** call this endpoint from your frontend. It is called by Razorpay's servers.

**Handled Events:**

| Event | Action |
|---|---|
| `payment.captured` | If escrow order → sets `EscrowTransaction.status = HELD`. If service order → activates `UserSubscription`, creates first `ServiceTicket`, sends activation email. |
| `payment.failed` | Sets `UserSubscription.paymentStatus = FAILED` |

**Response `200`:**

```json
{ "status": "ok" }
```

**Response `400`:**

```json
{ "error": "Invalid signature" }
```

---

### POST `/api/webhooks/clerk`

Receives signed webhook events from Clerk for user lifecycle sync.

**Auth:** Svix signature (`svix-id`, `svix-timestamp`, `svix-signature` headers)

> Do **not** call this endpoint from your frontend. It is called by Clerk's servers.
>
> Configure in Clerk Dashboard → Webhooks → Add Endpoint. Set `CLERK_WEBHOOK_SECRET` in `.env` to the signing secret provided.

**Handled Events:**

| Event | Action |
|---|---|
| `user.created` | Creates `User` record in DB with `role: USER`, captures `name`, `email`, `phone`, `profileImageUrl`. Also stamps `publicMetadata.role = 'USER'` in Clerk so the JWT Template includes it. |
| `user.updated` | Syncs `name`, `email`, `profileImageUrl` |
| `user.deleted` | Hard-deletes `User` record from DB |

**Response `200`:**

```json
{ "status": "ok" }
```

**Response `400`:**

```json
{ "error": "Invalid signature" }
```

---

## Notification Types Reference

| Type | Sent To | Trigger |
|---|---|---|
| `LEAD_NEW` | Admin | New unassigned lead submitted |
| `LEAD_ASSIGNED` | Partner | Lead assigned by admin |
| `PROPERTY_APPROVED` | Partner | Listing approved by admin |
| `PROPERTY_REJECTED` | Partner | Listing rejected by admin |
| `KYC_PENDING` | Admin | Partner submitted KYC |
| `KYC_UPDATE` | Partner | KYC approved or rejected |
| `DEAL_CLOSED` | Admin | Partner marked lead as closed |
| `ESCROW_REFUNDED` | User | Escrow refunded to buyer |
| `SERVICE_ACTIVATED` | User | Service subscription activated |
| `ANNOUNCEMENT` | Any | Admin broadcast |

---

## Lead Status Lifecycle

```
UNASSIGNED
    ↓ (Admin assigns)
ASSIGNED
    ↓ (Partner schedules visit)
SITE_VISIT_SCHEDULED
    ↓ (Partner verifies OTP at site)
SITE_VISIT_DONE
    ↓ (Escrow paid + Partner closes)
CLOSED
```

> A lead can also transition to `DROPPED` at any step before `CLOSED` (partner action).
> Only **Admin** can reopen a `CLOSED` lead.

---

## Escrow Status Lifecycle

```
(order created) → HELD → RELEASED
                       ↘ REFUNDED
```

---

## Enum Reference

### PropertyType
`FLAT` | `INDEPENDENT_HOUSE` | `VILLA` | `PLOT` | `COMMERCIAL_OFFICE` | `RETAIL_SHOP`

### ListingType
`SALE` | `RENT` | `LEASE`

### PublishStatus
`PENDING_APPROVAL` | `APPROVED` | `REJECTED` | `ARCHIVED`

### PropertyStatus
`READY_TO_MOVE` | `UNDER_CONSTRUCTION` | `SOLD` | `RENTED`

### LeadStatus
`UNASSIGNED` | `ASSIGNED` | `SITE_VISIT_SCHEDULED` | `SITE_VISIT_DONE` | `CLOSED` | `DROPPED`

### KycStatus
`NOT_SUBMITTED` | `PENDING_REVIEW` | `VERIFIED` | `REJECTED`

### TicketStatus
`OPEN` | `IN_PROGRESS` | `RESOLVED` | `VERIFIED_BY_USER`

### EscrowStatus
`HELD` | `RELEASED` | `REFUNDED`

### DocumentType
`PAN_CARD` | `AADHAR` | `SALARY_SLIP` | `FORM_16` | `BANK_STATEMENT`
