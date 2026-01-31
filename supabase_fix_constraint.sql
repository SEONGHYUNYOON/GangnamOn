-- ==============================================================================
-- Schema Fix: Update 'posts' table allowed types
-- ==============================================================================
-- 1. Drop the existing constraint
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;
-- 2. Add the new constraint with ALL allowed types (including new business ones)
ALTER TABLE public.posts
ADD CONSTRAINT posts_type_check CHECK (
          type IN (
               -- Original types
               'gathering',
               'question',
               'life',
               'club',
               'event',
               'hiking',
               'town_story',
               'news',
               'gangnam_pick',
               'daily_photo',
               'sports',
               'pet',
               'wine',
               -- NEW Business types
               'startup_freelance',
               'lunch_networking',
               'recruit_proposal',
               'office_rent'
          )
     );