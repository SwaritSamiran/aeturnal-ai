-- supabase/migrations/001_create_meal_tracking_schema.sql
-- 📊 DATABASE SCHEMA FOR AETURNAL-AI
-- Uses Supabase Auth with proper UUID references

-- ============================================
-- USERS TABLE (Extends Supabase Auth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  
  -- Health Profile
  age INTEGER,
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  medical_history TEXT,
  daily_activity TEXT,
  selected_class TEXT DEFAULT 'general',
  
  -- Gamification Stats
  level INTEGER DEFAULT 1,
  rank TEXT DEFAULT 'NOVICE',
  current_xp INTEGER DEFAULT 0,
  xp_needed INTEGER DEFAULT 1000,
  vitality INTEGER DEFAULT 100,
  max_vitality INTEGER DEFAULT 100,
  
  -- Tracking Stats
  current_streak INTEGER DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  good_choices INTEGER DEFAULT 0,
  bad_choices INTEGER DEFAULT 0,
  
  -- Profile
  profile_picture TEXT,
  bio TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_meal_logged TIMESTAMP
);

-- ============================================
-- MEAL LOGS TABLE
-- ============================================
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Food Information
  food_name TEXT NOT NULL,
  choice TEXT NOT NULL, -- 'red' or 'blue'
  
  -- Health Impact
  vitality_delta INTEGER NOT NULL, -- Change to vitality
  xp_delta INTEGER NOT NULL, -- XP gained/lost
  
  -- AI Analysis (for future reference)
  red_pill_truth TEXT,
  blue_pill_optimization TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT valid_choice CHECK (choice IN ('red', 'blue')),
  CONSTRAINT vitality_delta_range CHECK (vitality_delta BETWEEN -100 AND 100),
  CONSTRAINT xp_delta_range CHECK (xp_delta BETWEEN -100 AND 100)
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  achievement_key TEXT NOT NULL, -- 'first-scan', 'blue-pill-streak-5', etc.
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  unlocked_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(user_id, achievement_key)
);

-- ============================================
-- DAILY CHALLENGES TABLE
-- ============================================
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  challenge_key TEXT NOT NULL, -- 'scan-3-meals', 'blue-pill-streak', etc.
  progress INTEGER DEFAULT 0,
  goal INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  
  UNIQUE(user_id, challenge_key)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Speed up queries by user_id
CREATE INDEX idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_daily_challenges_user_id ON daily_challenges(user_id);

-- Speed up date range queries (for analytics)
CREATE INDEX idx_meal_logs_created_at ON meal_logs(created_at DESC);
CREATE INDEX idx_meal_logs_user_created ON meal_logs(user_id, created_at DESC);

-- Speed up achievement lookups
CREATE INDEX idx_achievements_key ON achievements(achievement_key);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Daily summary
CREATE VIEW daily_meal_summary AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as total_scans,
  SUM(CASE WHEN choice = 'blue' THEN 1 ELSE 0 END) as good_choices,
  SUM(CASE WHEN choice = 'red' THEN 1 ELSE 0 END) as bad_choices,
  SUM(vitality_delta) as total_vitality_delta,
  SUM(xp_delta) as total_xp_gained
FROM meal_logs
GROUP BY user_id, DATE(created_at);

-- User weekly stats
CREATE VIEW weekly_user_stats AS
SELECT 
  ml.user_id,
  DATE_TRUNC('week', ml.created_at) as week_start,
  COUNT(*) as scans_completed,
  SUM(CASE WHEN ml.choice = 'blue' THEN 1 ELSE 0 END) as good_choices,
  SUM(CASE WHEN ml.choice = 'red' THEN 1 ELSE 0 END) as bad_choices,
  SUM(ml.xp_delta) as total_xp,
  AVG(u.vitality) as avg_vitality
FROM meal_logs ml
JOIN users u ON ml.user_id = u.id
GROUP BY ml.user_id, DATE_TRUNC('week', ml.created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own meal logs
CREATE POLICY meal_logs_select_policy ON meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY meal_logs_insert_policy ON meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own achievements
CREATE POLICY achievements_select_policy ON achievements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own challenges
CREATE POLICY challenges_select_policy ON daily_challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY challenges_update_policy ON daily_challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- This would be populated by the frontend registration flow
-- INSERT INTO users (id, username, password_hash, age, weight_kg, height_cm, selected_class)
-- VALUES (gen_random_uuid(), 'john_doe', 'hashed_pwd', 25, 75, 180, 'glucose-guardian');
