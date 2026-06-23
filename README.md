# Multi-Tenant Notes

Multi-tenant notes application with a Next.js frontend and an Express/MongoDB backend.

## Final Architecture

This repository is a Next.js frontend plus Express backend. API behavior is implemented only in Express.

```text
Browser
  |
  | http://localhost:3000
  v
Next.js frontend
  |
  | /api/* rewrite using API_SERVER_URL
  v
Express API server
  |
  | Mongoose models scoped by tenantId
  v
MongoDB Atlas
```

Removed architecture decisions:

- No Next.js API route implementation remains under `app/api`.
- `/api/auth/*`, `/api/notes/*`, and `/api/tenants/*` are Express routes.
- Next.js proxies frontend `/api/*` requests to `API_SERVER_URL`.

## Security Model

- Public registration always creates role `user`.
- `role` in the public registration request body is ignored.
- Authenticated `admin` and `superadmin` users may create users in their own tenant with `POST /api/auth/users`.
- Only `superadmin` can create another `superadmin`.
- Role middleware supports `user`, `admin`, and `superadmin`.
- Tenant creation always uses server default plan `free`.
- `plan` in tenant creation and upgrade request bodies is ignored.
- Tenant upgrade can only set the authenticated tenant to the server-selected `pro` plan.
- Notes are always queried with `tenantId: req.tenant._id`.
- Tenant upgrades require authenticated tenant slug to match the URL slug.

## Endpoints

- `GET /health`
- `POST /api/tenants`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/users`
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/:id`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `POST /api/tenants/:slug/upgrade`

## Environment

Create `.env` from `.env.example`.

```bash
NODE_ENV=development
PORT=4000
API_SERVER_URL=http://localhost:4000
MASTER_DB_URL=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=http://localhost:3000
```

`MASTER_DB_URL`, `JWT_SECRET`, and `PORT` are required. `CORS_ORIGIN` is required in production.

## Local Development

Install dependencies:

```bash
npm install
```

Terminal 1, run the backend:

```bash
npm run dev:backend
```

Terminal 2, run the frontend:

```bash
npm run dev:frontend
```

Open `http://localhost:3000`. The frontend rewrites `/api/*` to `http://localhost:4000` unless `API_SERVER_URL` is changed.

Seed demo data:

```bash
npm run seed
```

Demo password for all seeded users is `password`.

Run tests:

```bash
npm test
```

Build frontend:

```bash
npm run build
```

## Deployment

Deploy the backend and frontend as separate services.

Backend service:

- Build command: `npm install`
- Start command: `npm run start:backend`
- Environment:
  - `NODE_ENV=production`
  - `PORT=<provider-port>`
  - `MASTER_DB_URL=<mongodb-atlas-url>`
  - `JWT_SECRET=<long-random-secret>`
  - `CORS_ORIGIN=https://your-frontend-domain.com`

Frontend service:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment:
  - `API_SERVER_URL=https://your-backend-domain.com`

Verify backend health:

```bash
curl https://your-backend-domain.com/health
```

Expected response:

```json
{ "status": "ok" }
```

## Tenant Isolation Verification

Tenant-owned data is stored with `tenantId`. Protected note operations load the tenant from the authenticated user and include `tenantId` in list, detail, update, and delete queries. The test suite asserts these query filters so a note ID from another tenant cannot be read, updated, or deleted through the API.

## Useful Commands

```bash
npm run dev:backend
npm run dev:frontend
npm run seed
npm test
npm run build
npm run start:backend
npm start
```
