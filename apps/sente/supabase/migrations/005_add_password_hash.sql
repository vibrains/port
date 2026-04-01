-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- After running this migration, set passwords for existing users manually:
-- UPDATE users SET password_hash = '<bcrypt-hash>' WHERE email = '<user-email>';
