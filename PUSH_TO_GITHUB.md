# Push to GitHub (ugochukwu16henry)

Run these commands in **PowerShell** from the project root `c:\Users\Dell\Documents\riseflowhub_v1.0`.

## 1. Create the repo on GitHub (one-time)

1. Go to [https://github.com/new](https://github.com/new) and sign in as **ugochukwu16henry**.
2. Repository name: **riseflowhub_v1.0**
3. Leave it **empty** (no README, no .gitignore).
4. Click **Create repository**.

## 2. Point remote to your account and push

```powershell
cd "c:\Users\Dell\Documents\riseflowhub_v1.0"
git remote set-url origin https://github.com/ugochukwu16henry/riseflowhub_v1.0.git
git branch -M main
git push -u origin main
```

If Git asks for credentials, use your **ugochukwu16henry** GitHub username and a **Personal Access Token** (Settings → Developer settings → Personal access tokens) as the password.
