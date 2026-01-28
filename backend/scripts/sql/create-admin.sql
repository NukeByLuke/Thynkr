-- Create admin account: admin@thynkr.ca / test123
INSERT INTO users (email, username, password, role, "emailVerified", "createdAt", "updatedAt") 
VALUES ('admin@thynkr.ca', 'admin', '$2a$10$fnM//7/3BnMEdfnGjadOEO7C0pvx12pZISOu8liAeTrnGQYwy4.lO', 'ADMIN', true, NOW(), NOW()) 
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'ADMIN', 
  "emailVerified" = true,
  password = '$2a$10$fnM//7/3BnMEdfnGjadOEO7C0pvx12pZISOu8liAeTrnGQYwy4.lO',
  "updatedAt" = NOW();
