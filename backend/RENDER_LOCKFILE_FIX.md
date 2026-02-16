# Render build: "frozen-lockfile" / pnpm-lock.yaml out of date

If Render fails with:

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json
```

do one of the following.

---

## Option 1 — Update the lockfile and push (recommended)

On your machine (in the repo):

1. Open a terminal in the project root.
2. Run:
   ```bash
   cd backend
   pnpm install
   ```
3. Commit and push the updated lockfile:
   ```bash
   git add pnpm-lock.yaml
   git commit -m "chore: update backend pnpm-lock.yaml"
   git push origin main
   ```
4. Let Render redeploy. The build should succeed.

---

## Option 2 — Temporary Render build command change

If you can't run `pnpm install` locally right now:

1. In **Render** → your backend service → **Settings** → **Build & Deploy**.
2. Set **Build Command** to:
   ```bash
   pnpm install --no-frozen-lockfile && pnpm run build
   ```
3. Save. Trigger a new deploy. The build should succeed because pnpm will update the lockfile (or install anyway).
4. Later: run Option 1 on your machine, then change the Build Command back to:
   ```bash
   pnpm install && pnpm run build
   ```
   and push so future deploys use a committed, up-to-date lockfile.
