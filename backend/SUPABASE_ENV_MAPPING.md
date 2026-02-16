# Supabase env vars → RiseFlow Hub backend

Use this mapping when Supabase gives you a set of environment variables.

## Backend (`backend/.env`) — only these

| RiseFlow Hub backend variable | Supabase variable to use | Notes |
|-----------------------------|---------------------------|--------|
| `DATABASE_URL` | `POSTGRES_URL_NON_POOLING` | Append `&schema=public`. Use direct (5432) for `prisma migrate` / `db push` and local dev. |
| `JWT_SECRET` | (your own secret) | Backend uses its own JWT for login; not Supabase Auth. Use a strong random string (e.g. `openssl rand -base64 32`). |

**Example (do not commit real values):**

```env
# From Supabase: use non-pooling URL and add schema=public
DATABASE_URL="postgres://postgres.PROJECT_REF:PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&schema=public"
JWT_SECRET=your-own-jwt-secret-for-express-auth
PORT=4000
```

For **production** (e.g. Railway/Render), you can set `DATABASE_URL` to the **pooler** URL (port 6543) if your host supports it; ensure `?schema=public` is in the string.

---

## Frontend

The app uses the **Express backend** for auth and API, not Supabase Auth. So the frontend only needs:

- `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `http://localhost:4000` or your deployed API URL).

You do **not** need `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` unless you add Supabase client features (e.g. Storage, Realtime) later.

---

## Security

- Never commit `.env` or paste real credentials into chat or docs.
- If credentials were exposed, rotate them in Supabase: Database password, anon key, service role key.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and DB password only on the server/backend; never in frontend or public env.
