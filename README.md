# Secure Document Vault Platform — Backend

Production-ready Node.js + Express backend aligned with the PRD.

## Structure

```
src/
  config/         # Environment config (no hardcoded secrets)
  db/             # SQLite connection, schema, init
  middleware/     # auth, RBAC, ownership, error, rate limit, validate, upload
  routes/         # auth, folders, documents, audit
  controllers/    # Thin handlers; logic in services
  services/       # auth, folder, document, share, audit
  utils/          # response, logger, security, validationSchemas
  app.js          # Express app
  server.js       # Entry point
```

## Setup

1. Copy environment file and set values:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize database and upload directory:
   ```bash
   npm run init-db
   ```
4. Start server:
   ```bash
   npm start
   # or
   npm run dev
   ```

## API Base

All API routes are under `/api`.

- `GET /api/health` — Health check (no auth)
- `POST /api/auth/register` — Register (body: email, password, role?)
- `POST /api/auth/login` — Login (rate limited; body: email, password)
- `GET /api/auth/me` — Current user (JWT required)
- `GET/POST/PATCH/DELETE /api/folders` — Folders (auth, ownership)
- `GET/POST/DELETE /api/documents` — Documents (auth, ownership/share)
- `GET /api/documents/:id/download` — Stream download
- `POST/DELETE/GET /api/documents/:id/shares` — Share management (owner only)
- `GET /api/audit/me` — Own audit logs
- `GET /api/audit/export?startDate=&endDate=` — Export logs (admin only)

## Security

- JWT with expiration; no hardcoded secrets; dotenv.
- bcrypt ≥10 salt rounds; no plaintext passwords; login uses constant-time compare (generic "Invalid credentials").
- CORS restricted to `ALLOWED_ORIGIN` (no open CORS).
- RBAC: Admin, Member, Viewer; ownership middleware.
- Parameterized queries; Joi validation; rate limiting on login and upload.
- Centralized error handler; no stack traces in production; standard response format; path traversal protection.

## Database (SQLite)

- **Indexes:** `users(email)`, `users(role)`; `folders(owner_id)`, `folders(parent_id)`; `documents(owner_id)`, `documents(folder_id)`, `documents(created_at)`; `shares(document_id)`, `shares(grantee_id)`; `audit_log(actor_id)`, `audit_log(created_at)`, `audit_log(resource_type, resource_id)`.
- **Unique:** `users(email)`.
- **Foreign keys:** Enabled via `db.pragma('foreign_keys = ON')` in `db/connection.js` and `db/init.js`.

## Docker (containerized backend)

Build and run with production dependencies only:

```bash
docker build -t secure-vault-backend .
docker run -p 5000:5000 --env-file .env secure-vault-backend
```

Container listens on **PORT 5000**. Ensure `.env` has `PORT=5000` (or omit; Dockerfile sets it), `JWT_SECRET`, `DATABASE_PATH`, and `ALLOWED_ORIGIN`. For persistent data, mount a volume for `DATABASE_PATH` and `UPLOAD_STORAGE_PATH`.

Test health: `GET http://localhost:5000/api/health`

## Tests

```bash
npm test
```

Uses Jest + Supertest. Covers: register, login, invalid credentials (generic message), unauthorized access (documents, folders, upload without token), RBAC (viewer cannot access admin audit export). Env for tests: `DATABASE_PATH`, `JWT_SECRET`, `ALLOWED_ORIGIN` (see `jest.setup.js`).

## Audit (production deps)

```bash
npm audit --omit=dev --audit-level=high
```

Production dependencies are kept at 0 high-severity vulnerabilities (bcrypt@6 used for clean audit). Dev-only issues (e.g. ESLint) do not block production.

## Lint

```bash
npm run lint
npm run lint:fix
```

## Deployment (Step 7)

Choose a target and configure env + volumes:

- **Local Docker** — `docker run` with `--env-file` and volume mounts.
- **DigitalOcean / AWS ECS / Railway / Render** — Use the same image; set env vars in the platform and attach persistent storage for `data/` (DB + uploads).
