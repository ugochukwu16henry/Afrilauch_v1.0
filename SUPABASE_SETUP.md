# RiseFlow Hub — Supabase setup

Use **Supabase** as the PostgreSQL database for the Express backend. The app keeps your existing Node/Express API; Supabase is the database (and optionally Storage later).

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose an organization (or create one).
4. Set **Name** (e.g. `riseflowhub`), **Database password** (save it securely), and **Region**.
5. Click **Create new project** and wait for the project to be ready.

---

## 2. Get the database connection string

1. In the Supabase Dashboard, open your project.
2. Go to **Project Settings** (gear icon) → **Database**.
3. Under **Connection string**, select **URI**.
4. Copy the URI. It looks like:
   - **Direct:**  
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
   - **Pooler (recommended for deployed backends):**  
     Use the **Session mode** or **Transaction mode** tab and copy the URI (often port **6543**).
5. Replace `[YOUR-PASSWORD]` with the database password you set in step 1.
6. Append `?schema=public` so Prisma uses the `public` schema:  
   `...postgres?schema=public`

---

## 3. Configure the backend

1. In the repo, go to the backend folder:
   ```bash
   cd backend
   ```
2. Copy the example env file (if you don’t have a `.env` yet):
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?schema=public"
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   PORT=4000
   ```
   Use the **pooler** URI (port 6543) if you deploy the backend to Railway/Render/serverless.

---

## 4. Push schema and seed the database

From the `backend` folder:

```bash
pnpm install
pnpm prisma generate
```

If your Supabase `DATABASE_URL` is in **`.env.local`** (not `.env`), use:

```bash
pnpm run db:push:local
pnpm run db:seed
```

Otherwise (if `DATABASE_URL` is in `.env`):

```bash
pnpm prisma db push
pnpm run db:seed
```

- **`db push`** / **`db:push:local`** — Creates/updates tables in Supabase to match `prisma/schema.prisma`. Use `db:push:local` when using `.env.local`.
- **`db:seed`** — Creates the default tenant, test users (e.g. `test-super_admin@example.com` / `Password123`), and CMS content. The seed script loads `.env.local` automatically.

---

## 5. Run the backend

```bash
pnpm run dev
```

The API runs at **http://localhost:4000**. The frontend (with `NEXT_PUBLIC_API_URL=http://localhost:4000`) will use this backend and Supabase as the database.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Create a Supabase project and set a DB password |
| 2 | Copy **Database → Connection string (URI)** and add `?schema=public` |
| 3 | Put it in `backend/.env` as `DATABASE_URL` |
| 4 | Run `pnpm prisma generate`, `pnpm prisma db push`, `pnpm run db:seed` in `backend` |
| 5 | Start backend with `pnpm run dev` |

For deployment, use the **connection pooler** URI (port 6543) in production and set `DATABASE_URL` in your backend host (Railway, Render, etc.). See `DEPLOYMENT.md` for full deployment steps.
