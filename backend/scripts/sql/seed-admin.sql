-- Seed admin user for production
INSERT INTO users (
  id,
  email,
  username,
  password,
  "firstName",
  "lastName",
  role,
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  'clprodadmin001',
  'admin@thynkr.study',
  'admin',
  '$2b$12$3izzeiJynmjmunpqa93x4ep9T7UUhgvbLkGvo46oTZxViGvMh6KtC',
  'Admin',
  'User',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
