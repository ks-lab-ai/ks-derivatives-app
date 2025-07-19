-- Database restructure for new hierarchy: Module → Chapter → Course
-- This migration preserves existing data by renaming and restructuring existing tables

-- Step 1: Rename existing tables to new structure
ALTER TABLE public.courses RENAME TO modules;
ALTER TABLE public.course_modules RENAME TO chapters;

-- Step 2: Update column references in chapters table
ALTER TABLE public.chapters RENAME COLUMN course_id TO module_id;

-- Step 3: Create new courses table (individual lessons within chapters)
CREATE TABLE public.courses_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    video_url TEXT, -- Always has a video
    video_duration_minutes INTEGER,
    file_url TEXT, -- Optional attached file
    file_name TEXT,
    quiz_id UUID, -- Optional quiz
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 4: Drop ALL policies and constraints that depend on module_content
-- Drop all policies on module_content
DROP POLICY IF EXISTS "Users can read enrolled module content" ON module_content;
DROP POLICY IF EXISTS "Everyone can read published module content" ON module_content;
DROP POLICY IF EXISTS "Moderators can manage module content" ON module_content;

-- Drop any other policies that might reference module_content in their conditions
DO $$
DECLARE
    pol_record record;
BEGIN
    -- Get all policies that might reference module_content
    FOR pol_record IN
        SELECT schemaname, tablename, policyname, qual, with_check
        FROM pg_policies 
        WHERE (qual LIKE '%module_content%' OR with_check LIKE '%module_content%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_record.policyname || '" ON ' || 
                pol_record.schemaname || '.' || pol_record.tablename;
    END LOOP;
END $$;

-- Drop any foreign key constraints that reference module_content
ALTER TABLE IF EXISTS quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_module_content_id_fkey;
ALTER TABLE IF EXISTS user_progress DROP CONSTRAINT IF EXISTS user_progress_module_content_id_fkey;

-- Step 5: Populate new courses table from existing module_content
INSERT INTO public.courses_new (chapter_id, title, order_index, video_url, video_duration_minutes, file_url, quiz_id, created_at)
SELECT 
    module_id as chapter_id,
    COALESCE(title, 'Cours ' || order_index) as title,
    order_index,
    video_url,
    video_duration_minutes,
    file_url,
    quiz_id,
    created_at
FROM public.module_content
WHERE content_type IN ('video', 'file') OR video_url IS NOT NULL;

-- Step 6: Drop old module_content table and rename new courses table
DROP TABLE public.module_content CASCADE;
ALTER TABLE public.courses_new RENAME TO courses;

-- Step 6: Update existing relationship tables

-- Rename course_registrations to module_registrations and update column
ALTER TABLE public.course_registrations RENAME TO module_registrations;
ALTER TABLE public.module_registrations RENAME COLUMN course_id TO module_id;

-- Rename module_progress to course_progress and update references
ALTER TABLE public.module_progress RENAME TO course_progress_old;

CREATE TABLE public.course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, course_id)
);

-- Note: You may want to manually migrate course_progress_old data based on your business logic
-- For now, we'll keep the old table as backup

-- Rename course_reviews to module_reviews and update column
ALTER TABLE public.course_reviews RENAME TO module_reviews;
ALTER TABLE public.module_reviews RENAME COLUMN course_id TO module_id;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_module ON chapters(module_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order ON chapters(order_index);
CREATE INDEX IF NOT EXISTS idx_courses_chapter ON courses(chapter_id);
CREATE INDEX IF NOT EXISTS idx_courses_order ON courses(order_index);
CREATE INDEX IF NOT EXISTS idx_module_registrations_user ON module_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_module_registrations_module ON module_registrations(module_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress(course_id);

-- 4. Create updated_at triggers
DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_progress_updated_at ON course_progress;
CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON course_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_module_reviews_updated_at ON module_reviews;
CREATE TRIGGER update_module_reviews_updated_at BEFORE UPDATE ON module_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_reviews ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies

-- MODULES POLICIES (similar to old courses policies)
CREATE POLICY "Everyone can read published modules" ON modules
    FOR SELECT USING (is_published = true);

CREATE POLICY "Moderators can read all modules" ON modules
    FOR SELECT USING (is_admin_or_moderator() OR is_published = true);

CREATE POLICY "Moderators can manage modules" ON modules
    FOR ALL USING (is_admin_or_moderator());

-- CHAPTERS POLICIES
CREATE POLICY "Users can read enrolled module chapters" ON chapters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM module_registrations 
            WHERE module_registrations.module_id = chapters.module_id 
            AND module_registrations.user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can read published module chapters" ON chapters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM modules 
            WHERE modules.id = chapters.module_id 
            AND modules.is_published = true
        )
    );

CREATE POLICY "Moderators can manage chapters" ON chapters
    FOR ALL USING (is_admin_or_moderator());

-- COURSES POLICIES  
CREATE POLICY "Users can read enrolled courses" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN module_registrations ON module_registrations.module_id = chapters.module_id
            WHERE chapters.id = courses.chapter_id 
            AND module_registrations.user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can read published courses" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN modules ON modules.id = chapters.module_id
            WHERE chapters.id = courses.chapter_id 
            AND modules.is_published = true
        )
    );

CREATE POLICY "Moderators can manage courses" ON courses
    FOR ALL USING (is_admin_or_moderator());

-- MODULE REGISTRATIONS POLICIES
CREATE POLICY "Users can read own module registrations" ON module_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own module registrations" ON module_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own module registrations" ON module_registrations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Moderators can manage module registrations" ON module_registrations
    FOR ALL USING (is_admin_or_moderator());

-- COURSE PROGRESS POLICIES
CREATE POLICY "Users can manage own course progress" ON course_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view course progress" ON course_progress
    FOR SELECT USING (auth.uid() = user_id OR is_admin_or_moderator());

-- MODULE REVIEWS POLICIES
CREATE POLICY "Users can manage own module reviews" ON module_reviews
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read published module reviews" ON module_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM modules 
            WHERE modules.id = module_reviews.module_id 
            AND modules.is_published = true
        )
    );

-- 7. Data migration script (to be run after creating new tables)
-- This migrates existing data to the new structure

/*
-- Step 1: Migrate courses to modules
INSERT INTO modules (id, title, description, category_id, picture_url, notes, difficulty, order_index, is_published, created_by, created_at, updated_at)
SELECT id, title, description, category_id, picture_url, notes, difficulty, order_index, is_published, created_by, created_at, updated_at
FROM public.courses;

-- Step 2: Migrate course_modules to chapters  
INSERT INTO chapters (id, module_id, name, order_index, estimated_time_minutes, created_at, updated_at)
SELECT id, course_id, name, order_index, estimated_time_minutes, created_at, updated_at
FROM public.course_modules;

-- Step 3: Create courses from module_content
INSERT INTO courses (chapter_id, title, order_index, video_url, video_duration_minutes, file_url, quiz_id, created_at)
SELECT 
    module_id as chapter_id,
    COALESCE(title, 'Course ' || order_index) as title,
    order_index,
    video_url,
    video_duration_minutes,
    file_url,
    quiz_id,
    created_at
FROM public.module_content
WHERE content_type = 'video' OR video_url IS NOT NULL;

-- Step 4: Migrate registrations
INSERT INTO module_registrations (user_id, module_id, registered_at)
SELECT user_id, course_id as module_id, registered_at
FROM public.course_registrations;

-- Step 5: Migrate progress (this will need manual review based on new structure)
-- We'll need to create course_progress entries based on module_progress

-- Step 6: Migrate reviews
INSERT INTO module_reviews (module_id, user_id, rating, review_text, created_at, updated_at)
SELECT course_id as module_id, user_id, rating, review_text, created_at, updated_at
FROM public.course_reviews;
*/