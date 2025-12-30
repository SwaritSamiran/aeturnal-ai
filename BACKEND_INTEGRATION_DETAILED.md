# DETAILED BACKEND INTEGRATION GUIDE

## Overview
This document provides comprehensive instructions for integrating your AI model backend with the Aeturnus-AI frontend.

## Architecture

```
Frontend (Next.js/React) ←→ Your Backend API ←→ AI Model
```

## Key Integration Points

### 1. Food Scanning System

**Location in Code:** `components/dashboard-stage.tsx` - `handleScan()` function

**What it does:** When user enters food name or uploads package image

**Your Backend Needs To:**
- Receive food name and/or image
- Use OCR (if image) to extract nutrition label text
- Parse ingredient list
- Feed data to your AI model for analysis
- Return health assessment and recommendations

**Example Integration:**
```typescript
const handleScan = async () => {
  if (!foodInput) return

  try {
    // Call your backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
      },
      body: JSON.stringify({
        foodInput,
        imageBase64: uploadedImage, // if user uploaded image
        userData: {
          age: userData.age,
          weight: userData.weight,
          height: userData.height,
          medicalHistory: userData.medicalHistory,
          selectedClass: userData.selectedClass
        }
      })
    })

    const data = await response.json()

    // Update UI with AI response
    setScanResult(data.detailedAnalysis)
    setPendingScan(data)
    setShowPillChoice(true)
  } catch (error) {
    console.error('[v0] Scan error:', error)
    // Show error to user
  }
}
```

### 2. Red/Blue Pill System

**Location in Code:** `components/dashboard-stage.tsx` - `handlePillChoice()` function

**What it does:** Records user's health decision

**Your Backend Needs To:**
- Log the user's choice
- Update user's health history
- Track patterns for weekly reports
- Award XP based on choice quality

**Example Integration:**
```typescript
const handlePillChoice = async (choice: 'red' | 'blue') => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/record-choice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
      },
      body: JSON.stringify({
        userId: userData.username,
        foodScanned: pendingScan.food,
        choice: choice,
        timestamp: new Date().toISOString(),
        nutritionalData: {
          calories: pendingScan.calories,
          sugar: pendingScan.sugar,
          // ... other nutrition data
        }
      })
    })

    const data = await response.json()

    // Update local state based on backend response
    if (choice === 'red') {
      setVitality(Math.max(0, vitality - 15))
    } else {
      setVitality(Math.min(100, vitality + 10))
      // Award XP from backend
      updateUserXP(data.xpAwarded)
    }
  } catch (error) {
    console.error('[v0] Choice recording error:', error)
  }
}
```

### 3. User Authentication

**Location in Code:** `components/landing-stage.tsx` - `handleSignup()` and `handleLogin()` functions

**Your Backend Needs To:**
- Create user accounts
- Authenticate users
- Store user health profiles
- Return JWT or session token

**Example Integration:**
```typescript
// Signup
const handleSignup = async (username: string, password: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()

    // Store auth token
    localStorage.setItem('authToken', data.token)

    // Proceed to onboarding
    onInitialize(username, password)
  } catch (error) {
    console.error('[v0] Signup error:', error)
  }
}

// Login
const handleLogin = async (username: string, password: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()

    // Store auth token
    localStorage.setItem('authToken', data.token)

    // Load user data
    loadUserProfile(data.userId)

    // Go directly to dashboard
    onReconnect(username, password)
  } catch (error) {
    console.error('[v0] Login error:', error)
  }
}
```

### 4. Weekly Health Reports

**Location in Code:** `components/dashboard-stage.tsx` - Weekly Report popup

**Your Backend Needs To:**
- Aggregate user's weekly activity
- Calculate health metrics
- Generate personalized insights

**Example Integration:**
```typescript
const fetchWeeklyReport = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/reports/weekly?userId=${userData.username}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    )

    const data = await response.json()
    setWeeklyReport(data)
  } catch (error) {
    console.error('[v0] Report fetch error:', error)
  }
}
```

### 5. Daily Challenges

**Location in Code:** `components/dashboard-stage.tsx` - Challenges popup

**Your Backend Needs To:**
- Generate daily challenges based on user's class
- Track challenge progress
- Reset challenges at midnight
- Award bonus XP

**Example Integration:**
```typescript
const fetchDailyChallenges = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/challenges/daily?userId=${userData.username}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    )

    const data = await response.json()
    setDailyChallenges(data.challenges)
  } catch (error) {
    console.error('[v0] Challenges fetch error:', error)
  }
}
```

## AI Model Requirements

Your AI model should be able to:

1. **Analyze Food Labels**
   - Extract nutrition facts from images (OCR)
   - Parse ingredient lists
   - Identify allergens and additives
   - Detect misleading health claims

2. **Personalized Health Assessment**
   - Consider user's age, weight, height
   - Factor in medical history (diabetes, hypertension, etc.)
   - Adapt to user's chosen health class
   - Calculate health risk scores

3. **Generate Recommendations**
   - Suggest healthier alternatives
   - Provide context-aware advice
   - Explain health impacts in simple terms
   - Offer neutralization strategies (e.g., "drink water after")

4. **Intent Inference**
   - Understand timing (e.g., energy drink at midnight = bad)
   - Consider meal context (breakfast vs late-night snack)
   - Detect patterns (repeated unhealthy choices)
   - Proactively suggest interventions

## Database Schema Suggestions

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  age INTEGER,
  weight FLOAT,
  height FLOAT,
  medical_history TEXT,
  selected_class VARCHAR(50),
  level INTEGER DEFAULT 1,
  rank VARCHAR(20) DEFAULT 'NOVICE',
  experience INTEGER DEFAULT 0,
  vitality INTEGER DEFAULT 100,
  created_at TIMESTAMP
);

-- Food scans table
CREATE TABLE food_scans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  food_name VARCHAR(255),
  calories INTEGER,
  protein FLOAT,
  carbs FLOAT,
  fats FLOAT,
  sugar FLOAT,
  sodium FLOAT,
  image_url VARCHAR(500),
  is_healthy BOOLEAN,
  health_risk VARCHAR(20),
  scanned_at TIMESTAMP
);

-- User choices table
CREATE TABLE user_choices (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  scan_id UUID REFERENCES food_scans(id),
  choice VARCHAR(10), -- 'red' or 'blue'
  xp_awarded INTEGER,
  vitality_change INTEGER,
  created_at TIMESTAMP
);

-- Daily challenges table
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  challenge_type VARCHAR(50),
  progress INTEGER DEFAULT 0,
  goal INTEGER,
  completed BOOLEAN DEFAULT false,
  date DATE,
  xp_reward INTEGER
);

-- Achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  achievement_id VARCHAR(50),
  unlocked_at TIMESTAMP
);
```

## Testing Your Integration

1. **Unit Test Each Endpoint**
   ```bash
   curl -X POST http://localhost:8000/api/scan \
     -H "Content-Type: application/json" \
     -d '{
       "foodInput": "Monster Energy Drink",
       "userData": {
         "age": "25",
         "selectedClass": "glucose-guardian"
       }
     }'
   ```

2. **Test Error Handling**
   - What if OCR fails?
   - What if food is not in database?
   - What if API is down?

3. **Performance Testing**
   - Image processing should be < 3 seconds
   - Text analysis should be < 1 second
   - Database queries should be < 500ms

## Security Best Practices

1. **Never expose your API keys in frontend code**
2. **Use environment variables for all secrets**
3. **Implement rate limiting on your backend**
4. **Validate all inputs server-side**
5. **Use HTTPS only for production**
6. **Implement JWT token expiration**

## Next Steps

1. Set up your backend server (Python/FastAPI, Node/Express, etc.)
2. Train/fine-tune your AI model on food nutrition data
3. Implement OCR for package label scanning
4. Create the database schema
5. Build the API endpoints listed above
6. Test integration with frontend
7. Deploy backend to cloud (AWS, GCP, Railway, etc.)
8. Update frontend environment variables
9. Test end-to-end
10. Present at hackathon!

## Questions?

All integration points are marked with detailed comments in the code. Search for:
- `// BACKEND INTEGRATION POINT`
- `// Your AI Model should...`
- `// Replace this mock data with...`

Good luck!
