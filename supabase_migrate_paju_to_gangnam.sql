-- ==============================================================================
-- Migration: paju_pick → gangnam_pick (run when you have existing posts.type)
-- ==============================================================================
-- Use this if your DB already has posts with type 'paju_pick' before switching
-- to GangnamOn. Reset schema does not need this (tables are recreated).

UPDATE posts SET type = 'gangnam_pick' WHERE type = 'paju_pick';
