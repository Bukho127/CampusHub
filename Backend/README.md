# Community Store Backend

Express + MongoDB API for the Community Store mobile app.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Make sure `.env` contains:

```bash
PORT=5000
MONGODB_URI=your-mongodb-uri
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8081
UPLOAD_DIR=src/uploads
MAX_FILE_SIZE_MB=5
```

3. Seed demo data:

```bash
npm run seed
```

4. Run the API:

```bash
npm run dev
```

The API will listen on `http://localhost:5000` unless `PORT` is changed.

## Scripts

- `npm run dev` - start the TypeScript server in watch mode.
- `npm run build` - compile to `dist`.
- `npm run start` - run compiled output.
- `npm run seed` - upsert categories, users, listings, and community posts.

## Auth

Send protected requests with:

```http
Authorization: Bearer <token>
```

Seeded users use the demo password `Password123!`.

## API Contract For Mobile

All JSON responses use:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

Errors use:

```json
{
  "success": false,
  "message": "What went wrong"
}
```

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/request-email-verification`
- `POST /api/auth/forgot-password`

### Listings

- `GET /api/categories`
- `GET /api/listings?q=&category=&minPrice=&maxPrice=&condition=&location=&sellerType=&minRating=&sort=&page=&limit=`
- `GET /api/listings/:id`
- `POST /api/listings` with `multipart/form-data`, field name `images`
- `PATCH /api/listings/:id` with JSON or `multipart/form-data`
- `DELETE /api/listings/:id`
- `PATCH /api/listings/:id/mark-sold`

Prices are stored and filtered as integer cents. For example, R350 is `35000`.

### Sellers And Users

- `GET /api/users/:id/public`
- `GET /api/sellers/:id`
- `GET /api/sellers/:id/listings`
- `PATCH /api/users/me`
- `PATCH /api/users/me/vendor-request`

Selecting vendor identity only creates a pending vendor request. It does not grant trusted vendor status.

### Favorites

- `GET /api/favorites`
- `POST /api/favorites/:listingId`
- `DELETE /api/favorites/:listingId`

### Community

- `GET /api/community-posts`
- `GET /api/community-posts/:id`
- `POST /api/community-posts`

### Reports

- `POST /api/reports/listing/:listingId`

### Admin Verification

- `PATCH /api/admin/users/:id/verification`

Admin route body can include `emailVerificationStatus`, `vendorVerificationStatus`, and `role`.

## Example Requests

Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Khanya\",\"lastName\":\"Jakavu\",\"email\":\"khanya@example.com\",\"password\":\"Password123!\",\"identityType\":\"student\"}"
```

Create a listing with images:

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer TOKEN" \
  -F "type=goods" \
  -F "title=Scientific Calculator" \
  -F "description=Good condition calculator for campus modules." \
  -F "category=electronics" \
  -F "priceCents=35000" \
  -F "condition=Good" \
  -F "quantityAvailable=1" \
  -F "location=District Six Campus" \
  -F "images=@calculator.png"
```

## Uploads

Multer currently stores images in `src/uploads`. Only JPEG, PNG, and WebP files are accepted. The upload service returns local URLs such as `/uploads/file.png`, and can later be replaced with cloud storage without changing controller contracts.

## Caching

The API uses a small cache layer with an in-memory LRU driver by default. Cached GET responses include `X-Cache: HIT` or `X-Cache: MISS` when `NODE_ENV` is not `production`.

Add these variables to configure caching:

```bash
CACHE_ENABLED=true
CACHE_DRIVER=memory
CACHE_URL=
CACHE_MAX_ENTRIES=500
CACHE_DEFAULT_TTL_SECONDS=60
```

Set `CACHE_ENABLED=false` to bypass the cache. Set `CACHE_DRIVER=redis` and `CACHE_URL=redis://...` to use Redis or Valkey. If Redis cannot connect, the API logs one warning and falls back to the in-memory driver.

Cached routes:

- `GET /api/categories` - 1 hour
- `GET /api/listings` - 60 seconds
- `GET /api/listings/:id` - 60 seconds
- `GET /api/sellers/:id` - 2 minutes
- `GET /api/sellers/:id/listings` - 2 minutes
- `GET /api/reviews/seller/:id` - 2 minutes
- `GET /api/users/:id/public` - 5 minutes
- `GET /api/community-posts` - 30 seconds, keyed by viewer id or `anon`
- `GET /api/community-posts/:id` - 30 seconds, keyed by viewer id or `anon`

Invalidation uses per-namespace version bumps instead of deleting every matching key. Listing creates, updates, deletes, and mark-sold actions refresh listing and seller caches. New reviews refresh seller review and seller caches. Profile/avatar updates refresh public user and seller caches. Community post creates, deletes, likes, and comments refresh community caches.

The in-memory driver is simple and needs no extra service, but entries are cleared on restart and are not shared across multiple server instances. Redis or Valkey should be used when multiple API instances need one shared cache.

Admin cache tools:

- `GET /api/admin/cache-stats` returns hit/miss/eviction counters, hit rate, driver, entry count, and enabled state.
- `POST /api/admin/cache/flush` clears cache entries and resets namespace versions.

Routes intentionally left uncached: all `/api/auth` routes, `/api/users/me`, `/api/favorites`, all existing `/api/admin` data-changing routes, and all `POST`, `PATCH`, and `DELETE` routes. These routes are user-specific, sensitive, or mutate data.
