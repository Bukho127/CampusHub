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
