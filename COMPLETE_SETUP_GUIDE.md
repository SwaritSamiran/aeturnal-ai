# 🎮 AETURNUS-AI - COMPLETE SETUP GUIDE FOR BEGINNERS
**Everything You Need to Know - From Zero to Deployed App**

---

## 📋 TABLE OF CONTENTS
1. [Understanding Your App Architecture](#architecture)
2. [Setting Up Database (Supabase)](#database)
3. [Hosting Your Frontend (Vercel)](#frontend-hosting)
4. [Setting Up Backend with Google Gemma](#backend)
5. [Connecting Frontend & Backend](#connecting)
6. [Automatic Systems (Daily Challenges, etc.)](#automatic-systems)
7. [Testing Everything](#testing)
8. [Deployment Checklist](#checklist)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ UNDERSTANDING YOUR APP ARCHITECTURE <a id="architecture"></a>

### What You Have Right Now:
- **Frontend**: The beautiful React app you see (HTML/CSS/JavaScript that runs in the browser)
- **Backend**: NOT BUILT YET - This is where your Google Gemma AI model will live
- **Database**: NOT SET UP YET - This is where user data, scans, challenges are stored

### How They Work Together:
```
USER BROWSER (Frontend)
    ↓ ↑
    (Makes requests / Gets responses)
    ↓ ↑
YOUR BACKEND SERVER (Google Gemma AI + API)
    ↓ ↑
    (Saves/Reads data)
    ↓ ↑
DATABASE (Supabase/PostgreSQL)
```

**Simple Example:**
1. User uploads food image in your app
2. Frontend sends image to your backend API
3. Backend runs Google Gemma to analyze the food
4. Backend saves the analysis to database
5. Backend sends red/blue pill choices back to frontend
6. Frontend shows Matrix-style pills to user
7. User picks a pill
8. Frontend tells backend which pill was chosen
9. Backend updates XP/vitality in database
10. Frontend shows updated progress bars

---

## 🗄️ SETTING UP DATABASE (SUPABASE) <a id="database"></a>

### Why Supabase?
- **Free tier** is generous (perfect for hackathons)
- **PostgreSQL database** (reliable and powerful)
- **Built-in authentication** (we won't use it, but it's there)
- **Auto-generated APIs** (makes your life easier)
- **Realtime updates** (your app updates instantly)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email
4. Verify your email if needed

### Step 2: Create a New Project
1. Click "New Project"
2. Fill in:
   - **Project name**: `aeturnus-ai` (or anything you want)
   - **Database Password**: SAVE THIS SOMEWHERE SAFE! You'll need it.
   - **Region**: Choose closest to you (e.g., "Singapore" if you're in Asia)
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup (grab some water!)

### Step 3: Create Database Tables
Once your project is ready:

1. Click **"SQL Editor"** in the left sidebar (it has a `>_` icon)
2. Click **"New query"**
3. Copy and paste this ENTIRE SQL script:

```sql
-- ============================================
-- AETURNUS-AI DATABASE SCHEMA
-- Copy this entire script into Supabase SQL Editor
-- ============================================

-- Users Table (stores all user information)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- NEVER store plain passwords!
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User profile data (from onboarding)
  age INTEGER,
  weight DECIMAL,
  height DECIMAL,
  medical_history TEXT,
  activity_level TEXT,
  
  -- Game stats
  selected_class TEXT, -- 'glucose_guardian', 'metabolic_warrior', etc.
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  xp_needed INTEGER DEFAULT 100, -- XP needed for next level
  rank TEXT DEFAULT 'Novice', -- Novice, Intermediate, Advanced, Expert, Master
  vitality INTEGER DEFAULT 80, -- Health points
  max_vitality INTEGER DEFAULT 100,
  
  -- Profile customization
  profile_picture TEXT DEFAULT '👤',
  bio TEXT,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_scan_date DATE,
  
  -- Statistics
  total_scans INTEGER DEFAULT 0,
  good_choices INTEGER DEFAULT 0,
  bad_choices INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0
);

-- Food Scans Table (every time user scans food)
CREATE TABLE food_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Scan data
  food_name TEXT NOT NULL,
  food_image_url TEXT, -- If you store images somewhere
  
  -- AI Analysis Results
  calories DECIMAL,
  protein DECIMAL,
  carbs DECIMAL,
  fats DECIMAL,
  sugar DECIMAL,
  sodium DECIMAL,
  harmful_ingredients TEXT[], -- Array of bad ingredients found
  health_score INTEGER, -- 0-100 score from your AI
  
  -- Red Pill (Bad Choice)
  red_pill_description TEXT, -- "Proceed with Monster Energy at 12 AM"
  red_pill_consequences TEXT, -- "You'll lose 15 vitality, disrupt sleep cycle..."
  red_pill_vitality_loss INTEGER,
  red_pill_xp_gain INTEGER DEFAULT 0,
  
  -- Blue Pill (Good Choice)
  blue_pill_description TEXT, -- "Choose Green Tea instead"
  blue_pill_benefits TEXT, -- "Natural caffeine, antioxidants..."
  blue_pill_vitality_gain INTEGER,
  blue_pill_xp_gain INTEGER,
  
  -- User's decision
  user_choice TEXT, -- 'red', 'blue', or NULL if not chosen yet
  choice_made_at TIMESTAMP WITH TIME ZONE
);

-- Daily Challenges Table
CREATE TABLE daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  challenge_type TEXT NOT NULL, -- 'scan_3_meals', 'choose_blue_3_times', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  max_progress INTEGER NOT NULL, -- e.g., 3 for "scan 3 meals"
  
  -- Unique constraint: one challenge per type per day
  UNIQUE(date, challenge_type)
);

-- User Challenge Progress (tracks each user's progress on daily challenges)
CREATE TABLE user_challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Unique constraint: one progress record per user per challenge
  UNIQUE(user_id, challenge_id)
);

-- Achievements Table (all possible achievements)
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_key TEXT UNIQUE NOT NULL, -- 'first_scan', 'scan_master', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  unlock_criteria JSONB NOT NULL, -- {"scans": 10} or {"streak": 7}, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements (which achievements each user has unlocked)
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: user can't unlock same achievement twice
  UNIQUE(user_id, achievement_id)
);

-- Weekly Reports Table (generated reports for each user)
CREATE TABLE weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Report stats
  total_scans INTEGER DEFAULT 0,
  good_choices INTEGER DEFAULT 0,
  bad_choices INTEGER DEFAULT 0,
  avg_vitality DECIMAL,
  health_score INTEGER, -- 0-100
  xp_earned INTEGER DEFAULT 0,
  
  -- Insights from AI
  key_insights TEXT,
  recommendations TEXT,
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one report per user per week
  UNIQUE(user_id, week_start_date)
);

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_food_scans_user_id ON food_scans(user_id);
CREATE INDEX idx_food_scans_date ON food_scans(scanned_at);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX idx_user_challenge_progress_user ON user_challenge_progress(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_weekly_reports_user ON weekly_reports(user_id);

-- ============================================
-- INSERT DEFAULT ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (achievement_key, title, description, icon, unlock_criteria) VALUES
  ('first_scan', 'First Scan', 'Complete your first food scan', '🎯', '{"scans": 1}'),
  ('scan_master', 'Scan Master', 'Complete 50 food scans', '🏆', '{"scans": 50}'),
  ('blue_pill_champion', 'Blue Pill Champion', 'Choose the healthy option 20 times', '💊', '{"good_choices": 20}'),
  ('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', '🔥', '{"streak": 7}'),
  ('level_10', 'Rising Star', 'Reach level 10', '⭐', '{"level": 10}'),
  ('vitality_guardian', 'Vitality Guardian', 'Keep vitality above 80 for 7 days', '❤️', '{"high_vitality_days": 7}');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Database setup complete! ✅ You can now close this query.' as message;
```

4. Click **"Run"** button (bottom right)
5. You should see: "Database setup complete! ✅"
6. If you see any errors, click "New query" and run it again

### Step 4: Get Your Database Credentials

1. Click **"Project Settings"** (gear icon in left sidebar, at the bottom)
2. Click **"API"** in the settings menu
3. You'll see important credentials. **COPY AND SAVE THESE SOMEWHERE SAFE**:

   - **Project URL**: Something like `https://abcdefgh.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this SECRET!)

4. Scroll down and find **"Connection String"**
5. Copy the **"URI"** connection string (looks like `postgresql://postgres:...`)
6. **REPLACE `[YOUR-PASSWORD]`** in the connection string with the database password you created in Step 2

**Example:**
```
Before: postgresql://postgres:[YOUR-PASSWORD]@db.abcd.supabase.co:5432/postgres
After:  postgresql://postgres:MySecurePass123@db.abcd.supabase.co:5432/postgres
```

---

## 🌐 HOSTING YOUR FRONTEND (VERCEL) <a id="frontend-hosting"></a>

### Why Vercel?
- **Made by the creators of Next.js** (your app uses Next.js)
- **Free tier** is perfect for projects like yours
- **Automatic deployments** from GitHub
- **Built-in serverless functions** (you can run backend code here!)
- **Super fast globally** (CDN included)

### Step 1: Get Your Code on GitHub

First, you need to save your code to GitHub:

1. Go to https://github.com
2. Sign up or log in
3. Click the **"+"** button (top right) → "New repository"
4. Fill in:
   - **Repository name**: `aeturnus-ai`
   - **Description**: "Health gamification app for food scanning"
   - **Visibility**: Private (keep it secret until after hackathon!)
5. Click **"Create repository"**

6. **Download your code from v0**:
   - In v0 chat, click the **three dots** (⋮) on your code block
   - Click **"Download ZIP"**
   - Extract the ZIP file on your computer

7. **Upload to GitHub**:
   - On your GitHub repository page, click **"uploading an existing file"**
   - Drag ALL the files from the extracted folder
   - Scroll down, click **"Commit changes"**

### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click **"Sign Up"** → Choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. Click **"Import Project"**
5. Find your `aeturnus-ai` repository and click **"Import"**
6. Vercel will auto-detect it's a Next.js app (smart!)
7. **IMPORTANT**: Before clicking "Deploy", you need to add environment variables

### Step 3: Add Environment Variables

1. In the Vercel deployment screen, scroll down to **"Environment Variables"**
2. Add these variables one by one:

**Variable 1:**
```
Name: DATABASE_URL
Value: [Paste your Supabase connection string from earlier]
Example: postgresql://postgres:MySecurePass123@db.abcd.supabase.co:5432/postgres
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Paste your Supabase Project URL]
Example: https://abcdefgh.supabase.co
```

**Variable 3:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Paste your Supabase anon/public key]
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Variable 4:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Paste your Supabase service_role key]
Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (different from anon key)
```

**Variable 5 (Backend API - We'll set this up next):**
```
Name: NEXT_PUBLIC_BACKEND_API_URL
Value: [Leave this EMPTY for now - we'll add it after backend setup]
```

3. Click **"Deploy"** button
4. Wait 2-3 minutes (Vercel is building your app)
5. You'll see **"Congratulations!"** with a link like `https://aeturnus-ai.vercel.app`
6. Click the link to see your app LIVE! 🎉

---

## 🤖 SETTING UP BACKEND WITH GOOGLE GEMMA <a id="backend"></a>

### Option A: Backend on Vercel (RECOMMENDED - Easiest)

You can put your backend IN THE SAME Vercel project as serverless functions!

### Option B: Separate Backend (Railway, Render, etc.)

If your AI model is too big for serverless, you need a separate server.

---

### OPTION A: BACKEND ON VERCEL (Serverless Functions)

This is the easiest approach for hackathons!

#### Step 1: Understand the Structure

In your project, create this folder structure:
```
your-project/
├── app/                  (Your frontend React code - already exists)
├── components/           (Already exists)
├── api/                  (CREATE THIS - Your backend code goes here)
│   ├── register.ts       (Handles user registration)
│   ├── login.ts          (Handles user login)
│   ├── scan-food.ts      (Handles food scanning with Gemma AI)
│   ├── make-choice.ts    (Handles red/blue pill selection)
│   ├── get-challenges.ts (Gets daily challenges)
│   └── ... (other endpoints)
```

#### Step 2: Install Required Packages

You need to install packages for:
- Database connection (PostgreSQL)
- Password hashing (for security)
- Google Gemma AI

Create a file called `package.json` in your project root (if it doesn't exist):

```json
{
  "name": "aeturnus-ai",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "framer-motion": "latest",
    "@google/generative-ai": "^0.1.3",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "typescript": "latest"
  }
}
```

#### Step 3: Create Database Helper

Create `lib/db.ts`:

```typescript
// lib/db.ts
// This file helps you connect to your Supabase database

import { Pool } from 'pg'

// Create a connection pool (reuses connections for better performance)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Needed for Supabase
  }
})

// Helper function to run SQL queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } catch (error) {
    console.error('[DB Error]:', error)
    throw error
  } finally {
    client.release()
  }
}

// Export the pool for advanced usage
export default pool
```

#### Step 4: Create API Routes

Create `app/api/register/route.ts`:

```typescript
// app/api/register/route.ts
// 🔵 BACKEND ENDPOINT: User Registration

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 1. Get data from frontend
    const body = await request.json()
    const { username, password } = body

    // 2. Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      )
    }

    // 3. Check if username already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // 4. Hash the password (NEVER store plain passwords!)
    const hashedPassword = await bcrypt.hash(password, 10)

    // 5. Insert new user into database
    const result = await query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2) 
       RETURNING id, username, created_at`,
      [username, hashedPassword]
    )

    const newUser = result.rows[0]

    // 6. Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[Registration Error]:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
```

Create `app/api/login/route.ts`:

```typescript
// app/api/login/route.ts
// 🔵 BACKEND ENDPOINT: User Login

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // 1. Get credentials from frontend
    const body = await request.json()
    const { username, password } = body

    // 2. Find user in database
    const result = await query(
      `SELECT id, username, password_hash, level, current_xp, rank, 
              vitality, selected_class, profile_picture, current_streak
       FROM users 
       WHERE username = $1`,
      [username]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // 3. Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // 4. Return user data (everything frontend needs)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        currentXp: user.current_xp,
        rank: user.rank,
        vitality: user.vitality,
        selectedClass: user.selected_class,
        profilePicture: user.profile_picture,
        currentStreak: user.current_streak
      }
    })

  } catch (error) {
    console.error('[Login Error]:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
```

Now the BIG ONE - Food scanning with Google Gemma!

Create `app/api/scan-food/route.ts`:

```typescript
// app/api/scan-food/route.ts
// 🤖 BACKEND ENDPOINT: Food Scanning with Google Gemma AI

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { query } from '@/lib/db'

// 🔵 INITIALIZE GOOGLE GEMMA
// Get your API key from: https://makersuite.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // 1. Get data from frontend
    const body = await request.json()
    const { 
      userId, 
      foodName, 
      foodImage, // Base64 encoded image or URL
      userClass, // 'glucose_guardian', 'metabolic_warrior', etc.
      userGoals // Any health goals from user profile
    } = body

    // 2. Prepare prompt for Gemma AI
    // This prompt is CRUCIAL - it tells Gemma how to analyze the food
    const prompt = `
You are a health AI analyzing food for a user with specific health goals.

USER PROFILE:
- Health Class: ${userClass}
- Health Goals: ${userGoals || 'General health improvement'}

FOOD TO ANALYZE: ${foodName}

Your task: Analyze this food and provide a detailed health assessment.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "foodName": "exact name of the food",
  "nutritionFacts": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fats": 0,
    "sugar": 0,
    "sodium": 0
  },
  "harmfulIngredients": ["ingredient1", "ingredient2"],
  "healthScore": 0-100,
  "redPill": {
    "title": "Short catchy title for bad choice",
    "description": "What happens if user consumes this",
    "consequences": "Specific health impacts relevant to their goals",
    "vitalityLoss": 0-30,
    "xpGain": 0
  },
  "bluePill": {
    "title": "Short catchy title for good choice",
    "description": "Healthier alternative or way to neutralize",
    "benefits": "Why this is better for their health goals",
    "vitalityGain": 0-20,
    "xpGain": 10-50
  }
}

IMPORTANT GUIDELINES:
1. Make it personal to their health class (e.g., focus on blood sugar for glucose_guardian)
2. Red pill should feel like a warning but not too harsh
3. Blue pill should be practical and achievable
4. XP rewards based on how much healthier the blue choice is
5. Vitality changes should reflect actual health impact

RESPOND ONLY WITH THE JSON, NO OTHER TEXT.
`

    // 3. Call Google Gemma AI
    console.log('[v0] Calling Gemma AI for food analysis...')
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    
    // If you have an image, use gemini-pro-vision instead:
    // const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })
    // const imagePart = { inlineData: { data: foodImage, mimeType: "image/jpeg" } }
    // const result = await model.generateContent([prompt, imagePart])
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysisText = response.text()

    console.log('[v0] Gemma AI response received')

    // 4. Parse AI response
    let analysis
    try {
      // Remove markdown code blocks if present
      const jsonText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      analysis = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('[v0] Failed to parse AI response:', analysisText)
      throw new Error('AI response was not valid JSON')
    }

    // 5. Save scan to database
    const scanResult = await query(
      `INSERT INTO food_scans (
        user_id, food_name, calories, protein, carbs, fats, sugar, sodium,
        harmful_ingredients, health_score,
        red_pill_description, red_pill_consequences, red_pill_vitality_loss, red_pill_xp_gain,
        blue_pill_description, blue_pill_benefits, blue_pill_vitality_gain, blue_pill_xp_gain
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, scanned_at`,
      [
        userId,
        analysis.foodName,
        analysis.nutritionFacts.calories,
        analysis.nutritionFacts.protein,
        analysis.nutritionFacts.carbs,
        analysis.nutritionFacts.fats,
        analysis.nutritionFacts.sugar,
        analysis.nutritionFacts.sodium,
        analysis.harmfulIngredients,
        analysis.healthScore,
        analysis.redPill.description,
        analysis.redPill.consequences,
        analysis.redPill.vitalityLoss,
        analysis.redPill.xpGain,
        analysis.bluePill.description,
        analysis.bluePill.benefits,
        analysis.bluePill.vitalityGain,
        analysis.bluePill.xpGain
      ]
    )

    const scan = scanResult.rows[0]

    // 6. Update user's total scans
    await query(
      'UPDATE users SET total_scans = total_scans + 1 WHERE id = $1',
      [userId]
    )

    // 7. Return analysis to frontend
    return NextResponse.json({
      success: true,
      scanId: scan.id,
      analysis: {
        foodName: analysis.foodName,
        nutritionFacts: analysis.nutritionFacts,
        harmfulIngredients: analysis.harmfulIngredients,
        healthScore: analysis.healthScore,
        redPill: analysis.redPill,
        bluePill: analysis.bluePill,
        scannedAt: scan.scanned_at
      }
    })

  } catch (error) {
    console.error('[Scan Food Error]:', error)
    return NextResponse.json(
      { error: 'Food scanning failed', details: error.message },
      { status: 500 }
    )
  }
}
```

Create `app/api/make-choice/route.ts`:

```typescript
// app/api/make-choice/route.ts
// 🔵 BACKEND ENDPOINT: User Makes Red/Blue Pill Choice

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, scanId, choice } = body // choice is 'red' or 'blue'

    // 1. Get scan details
    const scanResult = await query(
      `SELECT red_pill_vitality_loss, red_pill_xp_gain,
              blue_pill_vitality_gain, blue_pill_xp_gain
       FROM food_scans WHERE id = $1`,
      [scanId]
    )

    if (scanResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    const scan = scanResult.rows[0]

    // 2. Calculate changes based on choice
    let vitalityChange = 0
    let xpGain = 0
    let statUpdate = ''

    if (choice === 'red') {
      vitalityChange = -scan.red_pill_vitality_loss
      xpGain = scan.red_pill_xp_gain
      statUpdate = 'bad_choices = bad_choices + 1'
    } else if (choice === 'blue') {
      vitalityChange = scan.blue_pill_vitality_gain
      xpGain = scan.blue_pill_xp_gain
      statUpdate = 'good_choices = good_choices + 1'
    } else {
      return NextResponse.json(
        { error: 'Invalid choice' },
        { status: 400 }
      )
    }

    // 3. Update scan with user's choice
    await query(
      `UPDATE food_scans 
       SET user_choice = $1, choice_made_at = NOW() 
       WHERE id = $2`,
      [choice, scanId]
    )

    // 4. Get user's current stats
    const userResult = await query(
      `SELECT level, current_xp, xp_needed, vitality, max_vitality, 
              rank, total_xp_earned
       FROM users WHERE id = $1`,
      [userId]
    )

    const user = userResult.rows[0]

    // 5. Calculate new XP and check for level up
    let newXp = user.current_xp + xpGain
    let newLevel = user.level
    let newXpNeeded = user.xp_needed
    let leveledUp = false
    let newRank = user.rank

    // XP Formula: Each level needs more XP
    while (newXp >= newXpNeeded) {
      newXp -= newXpNeeded
      newLevel++
      newXpNeeded = Math.floor(100 * Math.pow(1.2, newLevel - 1)) // Exponential scaling
      leveledUp = true
    }

    // 6. Calculate new rank based on level
    if (newLevel >= 50) newRank = 'Master'
    else if (newLevel >= 30) newRank = 'Expert'
    else if (newLevel >= 20) newRank = 'Advanced'
    else if (newLevel >= 10) newRank = 'Intermediate'
    else newRank = 'Novice'

    // 7. Calculate new vitality (can't go below 0 or above max)
    let newVitality = Math.max(0, Math.min(
      user.max_vitality,
      user.vitality + vitalityChange
    ))

    // 8. Update user in database
    await query(
      `UPDATE users 
       SET current_xp = $1,
           level = $2,
           xp_needed = $3,
           vitality = $4,
           rank = $5,
           total_xp_earned = total_xp_earned + $6,
           ${statUpdate}
       WHERE id = $7`,
      [newXp, newLevel, newXpNeeded, newVitality, newRank, xpGain, userId]
    )

    // 9. Check if any achievements were unlocked
    // (You can add achievement checking logic here)

    // 10. Return updated stats to frontend
    return NextResponse.json({
      success: true,
      updates: {
        xpGained: xpGain,
        vitalityChange,
        newVitality,
        newXp,
        newLevel,
        newXpNeeded,
        newRank,
        leveledUp
      }
    })

  } catch (error) {
    console.error('[Make Choice Error]:', error)
    return NextResponse.json(
      { error: 'Failed to process choice' },
      { status: 500 }
    )
  }
}
```

#### Step 5: Get Google Gemma API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (looks like `AIzaSyD...`)
5. Go back to your Vercel project settings
6. Add a new environment variable:
   ```
   Name: GOOGLE_AI_API_KEY
   Value: [Paste your API key]
   ```
7. Redeploy your Vercel app (it will pick up the new variable)

#### Step 6: Deploy Backend Code

1. Push your new `api/` folder and `lib/` folder to GitHub
2. Vercel will automatically detect the changes and redeploy
3. Your backend API will be live at:
   ```
   https://your-app.vercel.app/api/register
   https://your-app.vercel.app/api/login
   https://your-app.vercel.app/api/scan-food
   https://your-app.vercel.app/api/make-choice
   ```

---

### OPTION B: SEPARATE BACKEND SERVER

If your AI model is too large for Vercel serverless (>50MB), use Railway or Render:

#### Railway (Recommended - Easy & Free)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your backend repository (you'll need to create a separate Python/Node backend repo)
5. Add environment variables in Railway dashboard
6. Railway will give you a URL like `https://your-backend.railway.app`
7. In Vercel, update the `NEXT_PUBLIC_BACKEND_API_URL` environment variable to this URL

---

## 🔗 CONNECTING FRONTEND & BACKEND <a id="connecting"></a>

### Step 1: Update Frontend API Calls

In your frontend code, I've already added comments showing where to make API calls. Here's how they work:

**Example: User Registration (in `components/landing-stage.tsx`)**

```typescript
// 🔵 BACKEND INTEGRATION POINT: User Registration
const handleRegister = async () => {
  try {
    // Call your backend API
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.username,
        password: formData.password
      })
    })

    const data = await response.json()

    if (data.success) {
      // Registration successful!
      console.log('[v0] User registered:', data.user)
      // Continue to onboarding...
      onNext()
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('[v0] Registration failed:', error)
    alert('Registration failed. Please try again.')
  }
}
```

**Example: Food Scanning (in `components/dashboard-stage.tsx`)**

```typescript
// 🔵 BACKEND INTEGRATION POINT: Food Scanning
const handleScanFood = async () => {
  try {
    setIsScanning(true)

    // Call your backend AI endpoint
    const response = await fetch('/api/scan-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        foodName: scanInput, // What user typed
        foodImage: uploadedImage, // Base64 image if they uploaded
        userClass: userData.selectedClass,
        userGoals: userData.medicalHistory
      })
    })

    const data = await response.json()

    if (data.success) {
      // Show the Matrix pills!
      setAnalysisResult(data.analysis)
      setShowPillChoice(true)
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('[v0] Scan failed:', error)
    alert('Scanning failed. Please try again.')
  } finally {
    setIsScanning(false)
  }
}
```

### Step 2: Test the Connection

1. Open your deployed app
2. Open browser DevTools (press F12)
3. Go to "Console" tab
4. Try registering a user
5. Look for `[v0]` log messages showing API calls
6. If you see errors, check the "Network" tab to see the actual API responses

---

## ⏰ AUTOMATIC SYSTEMS (How Daily Challenges Refresh) <a id="automatic-systems"></a>

### The Question: "Do I need to tell AI to refresh daily challenges?"

**Answer: NO! You use CRON JOBS** - automated tasks that run on a schedule.

### What are Cron Jobs?

Think of them like alarm clocks for your server:
- "Every day at midnight, create new challenges"
- "Every Sunday at 11 PM, generate weekly reports"
- "Every hour, check for expired streaks"

### Setting Up Cron Jobs on Vercel

Vercel has a feature called **Vercel Cron** (free on Pro plan, $20/month).

**Alternative: Use Supabase pg_cron (100% FREE)**

#### Step 1: Enable pg_cron in Supabase

1. Go to your Supabase dashboard
2. Click **"Database"** → **"Extensions"**
3. Search for `pg_cron`
4. Click **"Enable"**

#### Step 2: Create Daily Challenge Refresh Job

1. Go to **"SQL Editor"**
2. Create a new query
3. Paste this:

```sql
-- ============================================
-- AUTOMATIC DAILY CHALLENGE REFRESH
-- Runs every day at midnight UTC
-- ============================================

SELECT cron.schedule(
  'daily-challenges-refresh', -- Job name
  '0 0 * * *',                -- Cron expression: "At 00:00 every day"
  $$
  -- Delete yesterday's challenges
  DELETE FROM daily_challenges 
  WHERE date < CURRENT_DATE;

  -- Create today's challenges
  INSERT INTO daily_challenges (date, challenge_type, title, description, xp_reward, max_progress)
  VALUES
    (CURRENT_DATE, 'scan_3_meals', 'Daily Scanner', 'Scan 3 meals today', 30, 3),
    (CURRENT_DATE, 'choose_blue_3_times', 'Blue Pill Champion', 'Choose the healthy option 3 times', 50, 3),
    (CURRENT_DATE, 'maintain_vitality', 'Vitality Guardian', 'Keep vitality above 70', 25, 1)
  ON CONFLICT (date, challenge_type) DO NOTHING;
  $$
);
```

4. Click **"Run"**
5. Done! Challenges will now refresh automatically every day

#### Step 3: Create Weekly Report Generation Job

```sql
-- ============================================
-- AUTOMATIC WEEKLY REPORT GENERATION
-- Runs every Sunday at 11:00 PM UTC
-- ============================================

SELECT cron.schedule(
  'weekly-reports-generation',
  '0 23 * * 0', -- Every Sunday at 23:00
  $$
  -- Generate report for each user
  INSERT INTO weekly_reports (
    user_id, week_start_date, week_end_date,
    total_scans, good_choices, bad_choices, avg_vitality, health_score, xp_earned
  )
  SELECT 
    u.id as user_id,
    CURRENT_DATE - INTERVAL '7 days' as week_start_date,
    CURRENT_DATE as week_end_date,
    COUNT(fs.id) as total_scans,
    SUM(CASE WHEN fs.user_choice = 'blue' THEN 1 ELSE 0 END) as good_choices,
    SUM(CASE WHEN fs.user_choice = 'red' THEN 1 ELSE 0 END) as bad_choices,
    AVG(u.vitality) as avg_vitality,
    (
      CASE 
        WHEN SUM(CASE WHEN fs.user_choice = 'blue' THEN 1 ELSE 0 END) > 
             SUM(CASE WHEN fs.user_choice = 'red' THEN 1 ELSE 0 END) 
        THEN 80 
        ELSE 50 
      END
    ) as health_score,
    (u.total_xp_earned - COALESCE(prev_week.total_xp_earned, 0)) as xp_earned
  FROM users u
  LEFT JOIN food_scans fs ON fs.user_id = u.id 
    AND fs.scanned_at >= CURRENT_DATE - INTERVAL '7 days'
  LEFT JOIN (
    SELECT user_id, total_xp_earned
    FROM weekly_reports
    WHERE week_end_date = CURRENT_DATE - INTERVAL '7 days'
  ) prev_week ON prev_week.user_id = u.id
  GROUP BY u.id, prev_week.total_xp_earned
  ON CONFLICT (user_id, week_start_date) DO NOTHING;
  $$
);
```

#### Step 4: Create Streak Checker Job

```sql
-- ============================================
-- AUTOMATIC STREAK CHECKER
-- Runs every day at 1:00 AM to check streaks
-- ============================================

SELECT cron.schedule(
  'check-user-streaks',
  '0 1 * * *', -- Every day at 01:00
  $$
  -- Reset streak if user didn't scan yesterday
  UPDATE users
  SET 
    current_streak = 0,
    last_scan_date = NULL
  WHERE 
    last_scan_date < CURRENT_DATE - INTERVAL '1 day'
    AND current_streak > 0;
  $$
);
```

### How It Works Behind the Scenes

1. **User scans food today** → `last_scan_date` is set to today
2. **Tomorrow at 1 AM** → Cron job runs
3. **Cron checks**: "Did this user scan yesterday?"
4. **If NO** → Reset their streak to 0
5. **If YES** → Keep the streak going!

**You don't need to do ANYTHING.** The database does it automatically!

---

## 🧪 TESTING EVERYTHING <a id="testing"></a>

### Test Locally First (Before Deploying)

1. Install dependencies:
   ```bash
   cd your-project-folder
   npm install
   ```

2. Create a `.env.local` file in your project root:
   ```
   DATABASE_URL=postgresql://postgres:...@db.xyz.supabase.co:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   GOOGLE_AI_API_KEY=AIzaSy...
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

5. Test each feature:
   - ✅ Register new user
   - ✅ Login with credentials
   - ✅ Complete onboarding
   - ✅ Select a class
   - ✅ Scan a food
   - ✅ Choose red/blue pill
   - ✅ Check if XP/vitality updates
   - ✅ View calendar
   - ✅ Check daily challenges
   - ✅ View achievements
   - ✅ Check profile page

### Test in Production (After Deploying)

1. Go to your Vercel URL
2. Open DevTools (F12) → Console tab
3. Test all features again
4. Check for any `[v0]` error messages
5. In Vercel dashboard, check **"Logs"** to see backend errors

---

## ✅ DEPLOYMENT CHECKLIST <a id="checklist"></a>

Before your hackathon demo, make sure:

**Database:**
- ✅ Supabase project created
- ✅ All tables created (run SQL script)
- ✅ Default achievements inserted
- ✅ Cron jobs set up for auto-refresh
- ✅ Connection string saved

**Frontend:**
- ✅ Code pushed to GitHub
- ✅ Deployed to Vercel
- ✅ Environment variables added
- ✅ App loads without errors
- ✅ All pages work (landing, onboarding, class selection, dashboard)

**Backend:**
- ✅ All API routes created (`register`, `login`, `scan-food`, etc.)
- ✅ Google Gemma API key added
- ✅ Database connection working
- ✅ Password hashing working
- ✅ API endpoints responding

**Features:**
- ✅ User registration works
- ✅ Login works
- ✅ Food scanning returns red/blue pills
- ✅ Choosing pills updates XP/vitality
- ✅ Daily challenges display
- ✅ Achievements unlock
- ✅ Weekly reports generate
- ✅ Calendar shows past scans
- ✅ Profile is editable
- ✅ Theme toggle works (dark/light)

**Performance:**
- ✅ App loads in < 3 seconds
- ✅ Food scanning takes < 10 seconds
- ✅ No console errors
- ✅ Mobile responsive

---

## 🐛 TROUBLESHOOTING <a id="troubleshooting"></a>

### Common Issues & Solutions

#### 1. "Cannot connect to database"
**Problem:** `DATABASE_URL` is wrong or database is down

**Solution:**
- Check if `DATABASE_URL` in Vercel matches Supabase
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Test connection in Supabase SQL Editor: `SELECT NOW();`

#### 2. "API route not found (404)"
**Problem:** API files are in wrong location

**Solution:**
- API routes MUST be in `app/api/[name]/route.ts`
- Example: `app/api/register/route.ts` → `/api/register`
- Push to GitHub and redeploy

#### 3. "Gemma API key invalid"
**Problem:** API key is missing or wrong

**Solution:**
- Go to https://makersuite.google.com/app/apikey
- Create a NEW key
- Update `GOOGLE_AI_API_KEY` in Vercel
- Redeploy (Vercel → Deployments → click "..." → Redeploy)

#### 4. "Food scanning takes forever"
**Problem:** Gemma is processing a huge prompt or image is too large

**Solution:**
- Compress images before sending (resize to max 1024x1024)
- Shorten the AI prompt
- Consider using `gemini-pro` (faster) instead of `gemini-pro-vision`

#### 5. "Daily challenges not appearing"
**Problem:** Cron job didn't run or challenges weren't created

**Solution:**
- Manually run the SQL script to create today's challenges
- Check if pg_cron is enabled in Supabase
- View cron job logs in Supabase: 
  ```sql
  SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
  ```

#### 6. "Achievements not unlocking"
**Problem:** Achievement check logic not implemented

**Solution:**
- You need to create an API endpoint that checks achievements after each scan
- Add this to `make-choice` route:
  ```typescript
  // Check for achievements
  await checkAchievements(userId)
  ```

#### 7. "Can't upload food images"
**Problem:** Image upload not implemented

**Solution:**
- Use Vercel Blob for image storage (free 100MB)
- Or use Supabase Storage (free 1GB)
- Example:
  ```typescript
  import { put } from '@vercel/blob'
  const blob = await put('food-scans/image.jpg', file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN
  })
  ```

#### 8. "XP calculation is wrong"
**Problem:** Level-up logic has bugs

**Solution:**
- Check the formula in `make-choice` route
- Test with console.logs:
  ```typescript
  console.log('[v0] Current XP:', user.current_xp)
  console.log('[v0] XP needed:', user.xp_needed)
  console.log('[v0] New XP after gain:', newXp)
  ```

---

## 🎓 FINAL TIPS FOR YOUR HACKATHON

### 1. Demo Preparation
- Create a **test account** with impressive stats (Level 15, 50 scans, etc.)
- Prepare 3-4 food items to scan during demo (variety: healthy, unhealthy, medium)
- Practice the flow: Register → Onboard → Select Class → Scan → Choose Pill
- Show the Matrix red/blue pill animation - it's your unique feature!

### 2. Story to Tell Judges
"Most food label apps just show nutrition facts. We ask: *What if choosing healthy food was a game?*

Our AI analyzes any food and gives you a **Matrix-style choice**: 
- 🔴 Red Pill = Eat it anyway, face the consequences
- 🔵 Blue Pill = Choose the healthier path, gain XP

Every choice matters. You level up, rank up, unlock achievements. Your health journey becomes an RPG adventure."

### 3. Highlight Your Innovation
- **Intent inference**: AI understands user's health goals and personalizes advice
- **Gamification done right**: Not just badges - actual progression with ranks and levels
- **Matrix metaphor**: Makes healthy choices feel epic, not boring
- **Streaks & challenges**: Keeps users coming back (retention!)

### 4. What to Say If Asked Technical Questions

**Q: "How does your AI work?"**
A: "We use Google Gemma to analyze food labels and ingredients. It's trained to understand nutrition and health impacts. We give it the user's health profile, so recommendations are personalized."

**Q: "How do you store user data?"**
A: "PostgreSQL database on Supabase. Passwords are hashed with bcrypt for security. We track scans, choices, XP, and achievements."

**Q: "What if your AI makes a mistake?"**
A: "Great question! Our red pill always shows the 'proceed anyway' option, so users maintain autonomy. And the blue pill suggests alternatives rather than prohibiting. We empower informed choices."

**Q: "How scalable is this?"**
A: "We're on Vercel with serverless functions, so it scales automatically. Database can handle thousands of users. If we go viral, we can upgrade tiers seamlessly."

### 5. Backup Plan If Something Breaks
- Have **screenshots/video** of the app working
- Prepare a **slide deck** showing the flow
- Keep a **local version** running on your laptop
- Have the **Vercel deployment logs** open to quickly debug

---

## 🚀 YOU'RE READY!

You now have:
- ✅ Complete understanding of your app architecture
- ✅ Database set up with Supabase
- ✅ Frontend deployed on Vercel
- ✅ Backend API routes with Google Gemma integration
- ✅ Automatic systems (daily challenges, weekly reports)
- ✅ Testing checklist
- ✅ Troubleshooting guide
- ✅ Hackathon demo strategy

### Next Steps:
1. **Follow this guide step-by-step** (don't skip!)
2. **Test everything locally first**
3. **Deploy to production**
4. **Create test data for demo**
5. **Practice your pitch**
6. **WIN THE HACKATHON!** 🏆

---

## 📞 Need Help?

If you get stuck:
1. Check the [Troubleshooting section](#troubleshooting)
2. Look at Vercel deployment logs
3. Check browser console for `[v0]` messages
4. Test individual API endpoints with tools like Postman
5. Ask me specific questions with error messages

**You got this! Good luck with your hackathon!** 🎉
