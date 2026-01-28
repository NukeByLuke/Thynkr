#!/bin/bash
set -e

# This script ensures the database exists and is ready for Prisma migrations
# It runs automatically when the PostgreSQL container starts

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    -- Check if database exists
    SELECT 'CREATE DATABASE thynkr_db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'thynkr_db')\gexec
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE thynkr_db TO $POSTGRES_USER;
EOSQL

echo "✓ Database 'thynkr_db' is ready"
