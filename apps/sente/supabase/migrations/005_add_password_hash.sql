-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Set a default bcrypt hash for existing users (password: "changeme")
UPDATE users SET password_hash = '$2b$10$Ndw78U5ttWbrYx1JOW4qKeLqj7GbkR9ChemYRpW376VMHX9Ou2nZ6'
WHERE password_hash IS NULL;
