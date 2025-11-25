# Test Accounts

These accounts are seeded into the production database for testing purposes.

## Available Test Accounts

| Email | Password | Subscription Tier | Role |
|-------|----------|------------------|------|
| free@test.local | Password123! | Free | User |
| pro@test.local | Password123! | Pro | User |
| premium@test.local | Password123! | Premium | User |
| admin@test.local | + | Premium | Admin |

## Notes
docker exec root-postgres-1 psql -U thynkr -d thynkr_db -c "UPDATE users SET password = '\$2a\$10\$IQQyK0fLNTTNASqymag8E.N.H8Ydji.85XcPwsAsr.LYKYY0q4Ba6' WHERE email = 'testadmin@test.com';"
- All test accounts use the same password pattern for easy testing
- The admin account has full administrative privileges
- These accounts are automatically created when the database is first initialized
- You can change passwords after logging in via the Settings page

## Usage

1. Go to http://138.197.208.81
2. Enter preview password: `NukeByLuke`
3. Log in with any of the test accounts above

## Security Note

⚠️ **These are test accounts only!** 
- Do not use these credentials for production user data
- Change or remove these accounts before deploying to a public-facing production environment
- The preview password should also be changed for real production use
