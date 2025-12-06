-- Migration: Update Role enum from FREE/PRO to BASIC/STANDARD
-- The enum values BASIC and STANDARD have been added manually via ALTER TYPE
-- The old values FREE and PRO are deprecated but remain in the enum for backwards compatibility
-- This migration just marks the schema as updated

-- PostgreSQL doesn't allow removing enum values easily, so FREE and PRO remain
-- New code should only use BASIC, STANDARD, PREMIUM, ADMIN

SELECT 1;
