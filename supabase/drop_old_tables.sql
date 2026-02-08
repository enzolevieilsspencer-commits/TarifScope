-- ============================================
-- SUPPRESSION DES ANCIENNES TABLES
-- À exécuter dans Supabase SQL Editor après migration du code
-- vers les 3 tables : hotels, rate_snapshots, scraper_logs
-- ============================================
-- ATTENTION : supprime définitivement les données des anciennes tables.
-- Ne pas exécuter si vous avez encore besoin de ces données.

-- Ordre : supprimer les tables avec clés étrangères en premier
DROP TABLE IF EXISTS "Alert";
DROP TABLE IF EXISTS "RateSnapshot";
DROP TABLE IF EXISTS "RunLog";
DROP TABLE IF EXISTS "WatchConfig";
DROP TABLE IF EXISTS "Competitor";
DROP TABLE IF EXISTS "Hotel";

-- Vérification : il ne doit rester que les 3 tables du flux scraper (+ _prisma_migrations)
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
