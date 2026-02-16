-- Add User.birthday if missing (schema was ahead of production DB)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthday" DATE;
