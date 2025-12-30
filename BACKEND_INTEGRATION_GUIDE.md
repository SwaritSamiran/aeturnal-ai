# 🚀 BACKEND INTEGRATION GUIDE FOR AETURNUS-AI

## Overview
This guide explains how to connect your AI model backend to the React frontend.

---

## 🔴 INTEGRATION POINTS

### 1️⃣ FOOD SCAN API ENDPOINT

**Location in code:** `components/dashboard-stage.tsx` → `handleScan()` function

**What it does:** Sends food data to your AI model for analysis

**Frontend sends:**
```json
{
  "foodInput": "Monster Energy Drink",
  "imageFile": "base64_encoded_image_or_null",
  "userData": {
    "username": "john_doe",
    "age": "25",
    "weight": "75",
    "height": "180",
    "medicalHistory": "Type 2 Diabetes",
    "dailyActivity": "Moderate (30-60 min)",
    "selectedClass": "glucose-guardian"
  }
}
```

**Your AI model should return:**
```json
{
  "foodName": "MONSTER ENERGY DRINK (500ML)",
  "calories": 240,
  "protein": 0,
  "carbs": 60,
  "fats": 0,
  "sugar": 54,
  "sodium": 370,
  "ingredients": [
    "Carbonated Water",
    "Sugar",
    "Glucose",
    "Citric Acid",
    "Taurine",
    "Caffeine (160mg)"
  ],
  "allergens": [],
  "isHealthy": false,
  "healthScore": 25,
  "redPillWarnings": [
    "⚠️ EXTREME SUGAR: 54g (108% daily limit) - Dangerous for diabetics",
    "⚠️ HIGH CAFFEINE: 160mg at 12 AM disrupts sleep cycle",
    "⚠️ BLOOD SUGAR SPIKE: Expect crash in 2-3 hours",
    "⚠️ DEHYDRATION RISK: Caffeine + Sugar reduces water retention"
  ],
  "bluePillAlternatives": [
    "✅ GREEN TEA: Natural caffeine (30mg), zero sugar, antioxidants",
    "✅ BLACK COFFEE: 95mg caffeine, 0 calories, no crash",
    "✅ SPARKLING WATER + LEMON: Hydration without sugar",
    "✅ TAKE A 10-MIN WALK: Natural energy boost, better than caffeine"
  ],
  "personalizedAdvice": "As a GLUCOSE GUARDIAN, this drink is extremely dangerous. Your blood sugar will spike to unsafe levels. Consider the blue pill alternatives or postpone this drink until morning with food to minimize impact."
}
```

---

### 2️⃣ LOG USER CHOICE API

**Location in code:** `components/dashboard-stage.tsx` → `handlePillChoice()` function

**What it does:** Logs user decisions for tracking and improving recommendations

**Frontend sends:**
```json
{
  "username": "john_doe",
  "timestamp": "2025-01-15T14:30:00Z",
  "foodName": "MONSTER ENERGY DRINK",
  "choice": "blue",
  "nutritionData": {
    "calories": 240,
    "protein": 0,
    "carbs": 60,
    "fats": 0
  },
  "vitalityChange": -8,
  "xpGained": 0
}
```

**Your backend should:**
- Store this in database
- Calculate streaks (consecutive blue pill choices)
- Generate daily/weekly reports
- Train your AI model on user preferences

---

### 3️⃣ USER REGISTRATION API

**Location in code:** `components/landing-stage.tsx` → Form submission

**Frontend sends:**
```json
{
  "username": "john_doe",
  "password": "hashed_password",
  "age": "25",
  "weight": "75",
  "height": "180",
  "medicalHistory": "Type 2 Diabetes, Hypertension",
  "dailyActivity": "Moderate (30-60 min)",
  "selectedClass": "glucose-guardian"
}
```

**Your backend should return:**
```json
{
  "success": true,
  "userId": "user_12345",
  "message": "BIO-PROFILE_INITIALIZED"
}
```

---

## 📂 RECOMMENDED BACKEND STRUCTURE

```
backend/
├── app.py (Flask/FastAPI)
├── models/
│   ├── food_analyzer.py      # Your AI model
│   ├── label_parser.py        # OCR for package images
│   └── recommendation_engine.py
├── routes/
│   ├── auth.py
│   ├── food_scan.py
│   └── user_data.py
└── database/
    ├── users.db
    └── meal_history.db
```

---

## 🎮 GAMIFICATION SUGGESTIONS TO IMPLEMENT

### ✅ Already Implemented:
- Level up system (XP → Level → Rank)
- Red/Blue pill choice mechanism
- Vitality bar (health points)
- Class selection system

### 💡 SUGGESTIONS TO ADD:

#### 1. **Daily Challenges**
```json
{
  "dailyChallenge": {
    "title": "PROTEIN HUNTER",
    "description": "Eat 3 meals with 20g+ protein",
    "reward": "+50 XP",
    "progress": "1/3"
  }
}
```

#### 2. **Streak System**
```
🔥 7-day blue pill streak = 2x XP multiplier
🔥 30-day streak = Special "MASTER GUARDIAN" badge
```

#### 3. **Achievement Badges**
```
🏆 "FIRST SCAN" - Complete your first food analysis
🏆 "WISE CHOICE" - Choose blue pill 10 times
🏆 "HEALTH WARRIOR" - Reach level 10
🏆 "INGREDIENT DETECTIVE" - Scan 50 different foods
```

#### 4. **Social Features** (Optional)
- Add friends and compare ranks
- Leaderboards for each class
- Share healthy alternatives

#### 5. **Meal Planning AI**
Your AI could suggest:
- "Based on your scans, you're low on protein this week"
- "You consumed 2500 calories yesterday, today aim for 2000"
- "Your sodium intake is high, here are low-sodium alternatives"

---

## 🔧 HOW TO CONNECT

### Step 1: Create your API endpoint
```python
# Example FastAPI endpoint
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

app = FastAPI()

class FoodScanRequest(BaseModel):
    foodInput: str
    userData: dict

@app.post("/api/analyze-food")
async def analyze_food(request: FoodScanRequest):
    # Your AI model logic here
    result = your_ai_model.analyze(
        food_name=request.foodInput,
        user_profile=request.userData
    )
    return result
```

### Step 2: Update frontend API call
In `components/dashboard-stage.tsx`, uncomment the fetch code:
```typescript
const response = await fetch('YOUR_BACKEND_URL/api/analyze-food', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ foodInput, userData })
})
```

### Step 3: Handle image uploads
```typescript
// Add this to handle image file uploads
const handleImageUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('userData', JSON.stringify(userData))
  
  const response = await fetch('YOUR_BACKEND_URL/api/scan-image', {
    method: 'POST',
    body: formData
  })
}
```

---

## 🎨 MAKING IT MORE LIVELY - IDEAS

1. **Add food emojis everywhere** ✅ (Done!)
2. **Animated food icons** - When scanning, show animated fork/knife
3. **Sound effects** - "Ding!" for blue pill, "Buzz!" for red pill
4. **Confetti animation** - When leveling up or completing challenges
5. **Progress animations** - Bars fill up smoothly with glow effects
6. **Micro-interactions** - Buttons bounce on hover, cards flip on click

---

## ❓ NEED HELP?

If you get stuck connecting the backend, check these common issues:

1. **CORS errors** - Add CORS headers to your backend
2. **API timeouts** - Your AI model might be taking too long
3. **Data format mismatch** - Double-check JSON structure
4. **Authentication** - Add JWT tokens if needed

---

## 🎯 FINAL NOTES

Your concept is BRILLIANT! The red/blue pill mechanic is such a clever way to gamify healthy eating. The backend AI model is the brain - the frontend just makes it beautiful and engaging. Make sure your AI:

1. **Learns from user behavior** (intent inference!)
2. **Personalizes recommendations** based on their health class
3. **Predicts** what they might eat next (proactive suggestions)
4. **Explains** why something is bad in simple terms

Good luck with the hackathon! 🚀
