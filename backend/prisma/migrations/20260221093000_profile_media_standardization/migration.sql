DO $$
DECLARE
  target_table text;
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    target_table := 'public.users';
  ELSIF to_regclass('public."User"') IS NOT NULL THEN
    target_table := 'public."User"';
  ELSE
    RAISE NOTICE 'No users/User table found; skipping profile media migration.';
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);', target_table);
  EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;', target_table);

  EXECUTE format('UPDATE %s SET profile_completed = CASE WHEN avatar_url IS NOT NULL AND btrim(avatar_url) <> '''' THEN true ELSE false END WHERE profile_completed IS DISTINCT FROM CASE WHEN avatar_url IS NOT NULL AND btrim(avatar_url) <> '''' THEN true ELSE false END;', target_table);
END $$;
