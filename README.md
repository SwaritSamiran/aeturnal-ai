# 🧬 Aeturnal-AI

> A gamified health & nutrition tracker powered by Google Gemini & Gemma AI

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)
![Gemma](https://img.shields.io/badge/Gemma-3--27b--it-4285F4?logo=google)
![Gemini](https://img.shields.io/badge/Gemini-2.5--flash-4285F4?logo=google)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)

---

## 🎮 What is Aeturnal-AI?

Aeturnal-AI transforms healthy eating into an RPG adventure inspired by "The Matrix"! Scan your food—via **text input or image upload**—and get AI-powered health insights through a unique **Red Pill / Blue Pill** choice system:

- 🔴 **Red Pill** - The honest truth about your food choice
- 🔵 **Blue Pill** - Healthier alternatives & optimizations

Earn XP, level up your character, and track your vitality as you make better food choices!

---

## ✨ FEATURES

- 🧠 **Intent Inference Engine**
  The core intelligence of the Aeturnal OS. Our **Gemma 3** pipeline doesn't just parse food names; it performs **Deep Intent Analysis**. It infers the biological "cost" of your consumption by cross-referencing your medical history, current BMI, and specific user class.

- 🎯 **Contextual Personalization (The Logic)**
  Every insight is tailored to your unique biometric code. 
  * **Example**: An apple is a "Vitality Boost" (+15 XP) for a **Metabolic Warrior** (Weight Loss), but triggers a "Glucose Warning" (-10 Vitality) for a **Glucose Guardian** (Diabetic). The system adapts to *who* you are, not just *what* you eat.

- 🤖 **Multimodal AI Analysis** - 📝 **Text Intel**: High-reasoning nutritional audits powered by **Google Gemma 3 27B**.
  - 🖼️ **Visual Scan**: Instant recognition of nutrition labels and food photos via **Google Gemini 2.5 Flash**.

- 🏆 **RPG Gamification** High-stakes health tracking with XP, levels, and specialized character classes like **Glucose Guardian**, **Metabolic Warrior**, and **Hypertrophy Titan**.

- 📊 **Dynamic Progress Tracking** Real-time HUD updates for **Vitality scores**, detailed meal history logs, and automated weekly system reports.

- 🔐 **Secure Mainframe Auth** Identity management handled via **Supabase Authentication** with full email/password encryption.

- 📱 **Responsive Interface** A sleek, cyberpunk-inspired UI built with **Next.js 15** and **Framer Motion**, optimized for both desktop and mobile terminals.

---

## 🚀 How to host locally

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Google AI API Key** - [Get one here](https://ai.google.dev)
- **Supabase Account** - [Sign up free](https://supabase.com)

### 1. Clone the Repository

```bash
git clone https://github.com/SwaritSamiran/aeturnal-ai.git
cd aeturnal-ai
```

### 2. Setup Backend

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create backend/.env file
echo "GEMINI_API_KEY=your_api_key_here" > backend/.env
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create frontend/.env.local file with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# BACKEND_URL=http://localhost:8000 (optional, defaults to http://localhost:8000)
```

### 4. Run the App

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```
Server runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App runs at: http://localhost:3000

---

## 📁 Project Structure

```
aeturnal-ai/
├── backend/
│   ├── main.py                          # FastAPI server with AI endpoints
│   ├── requirements.txt                 # Python dependencies
│   └── .env                             # API keys (create this!)
├── frontend/
│   ├── app/
│   │   ├── page.tsx                     # Main app page
│   │   ├── layout.tsx                   # Root layout
│   │   └── api/
│   │       ├── login/route.ts           # Auth endpoint
│   │       ├── register/route.ts        # Registration endpoint
│   │       ├── scan/route.ts            # Text food scan proxy
│   │       ├── scan-image/route.ts      # Image food scan proxy
│   │       ├── meal-log/route.ts        # Meal logging endpoint
│   │       ├── user/update/route.ts     # Profile update endpoint
│   │       └── weekly-report/route.ts   # Weekly stats endpoint
│   ├── components/
│   │   ├── dashboard-stage.tsx          # Main game dashboard
│   │   ├── landing-stage.tsx            # Landing page
│   │   ├── onboarding-stage.tsx         # Character creation
│   │   ├── class-selection-stage.tsx    # Class selection
│   │   ├── theme-provider.tsx           # Dark mode provider
│   │   └── ui/                          # shadcn/ui components
│   ├── lib/
│   │   ├── api-client.ts                # Frontend API calls
│   │   ├── auth.ts                      # Auth utilities
│   │   ├── db.ts                        # Database client
│   │   └── utils.ts                     # Helper functions
│   ├── styles/globals.css               # Global styles
│   └── .env.local                       # Supabase & API keys
├── supabase/
│   └── migrations/                      # Database schema
└── README.md                            # This file!
```

---

## 🔌 API Endpoints

### Backend Endpoints (FastAPI)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/health` | GET | Health check | ❌ |
| `/api/scan` | POST | Analyze food from text input | ❌ |
| `/api/identify-food` | POST | Identify food from image (Gemini vision) | ❌ |

### Frontend API Routes (Next.js)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/login` | POST | User login |
| `/api/register` | POST | User registration |
| `/api/scan` | POST | Proxy to backend food scan (text) |
| `/api/scan-image` | POST | Image upload → Identify → Scan |
| `/api/meal-log` | POST | Log meal choice to database |
| `/api/user/update` | POST | Update user profile |
| `/api/weekly-report` | GET | Get weekly stats |

### Example Requests

**Text Food Scan:**
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "foodInput": "Monster Energy Drink",
    "userData": {
      "username": "player1",
      "weight": "70",
      "height": "175",
      "age": "25",
      "selectedClass": "metabolic-warrior",
      "dailyActivity": "moderate",
      "medicalHistory": ""
    }
  }'
```

**Image Food Scan:**
```bash
curl -X POST http://localhost:3000/api/scan-image \
  -F "file=@nutrition_label.jpg" \
  -F 'userData={"username":"player1","weight":"70","height":"175","age":"25","selectedClass":"glucose-guardian","dailyActivity":"moderate","medicalHistory":""}'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | FastAPI 0.109, Python 3.10+ |
| **AI Models** | Google Gemma 3 27B (text), Google Gemini 2.5 Flash (vision) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **File Handling** | Pillow (image processing), python-multipart |

---

## 🎮 Game Mechanics

### Character Classes
- 🩸 **Glucose Guardian** - Monitor sugar intake (ideal for diabetics)
- 💪 **Metabolic Warrior** - Track calories & macros
- 🏋️ **Hypertrophy Titan** - Optimize protein intake
- 🫀 **Pressure Regulator** - Monitor sodium levels

### Progression System
- **Vitality**: Health score affected by food choices (0-100)
- **XP**: Earned by making healthy ("Blue Pill") choices
- **Levels**: Unlock achievements as you level up
- **Ranks**: From Novice → Intermediate → Advanced → Expert → Master

### Challenges & Achievements
- Daily challenges with XP rewards
- Special achievements (First Scan, Health Guardian, etc.)
- Weekly reports tracking progress

---

## 📸 Features in Detail

### Text Food Scanning
1. Enter food name in the scanner
2. Click "ANALYZE_FOOD"
3. Gemma AI analyzes based on your health profile
4. Choose Red or Blue Pill
5. Gain/lose vitality and XP

### Image Food Scanning *(NEW!)*
1. Click the upload area in the scanner
2. Select a nutrition label or food photo
3. Gemini 2.5 Flash identifies the food automatically
4. Analysis happens automatically
5. Choose Red or Blue Pill
6. **No image storage** - processed in-memory only

### Unified Analysis Button
The "ANALYZE_FOOD" button works for **both text and image**:
- If you entered text → Analyzes text
- If you uploaded image → Identifies food → Analyzes
- Can't submit empty (need text OR image)

---

## 🔐 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_google_ai_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BACKEND_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Frontend will auto-use port 3001
# Or kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "GEMINI_API_KEY not set"
- Make sure you created `backend/.env` with your API key
- Check that the key is valid at https://ai.google.dev

### "Food identification quota exceeded"
- Free tier has daily limits
- Wait for quota to reset (usually 24 hours)
- Or enable billing in Google AI Studio

### "Image upload fails"
- File must be: JPEG, PNG, WebP, or GIF
- File size must be < 10MB
- Backend must be running

---

## 📊 Database Schema

Key tables in Supabase:
- `users` - User profiles & stats
- `meal_logs` - Food scan history
- `achievements` - User achievements
- `daily_challenges` - Daily challenge progress

---

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm run build
# Deploy to Vercel via Git or CLI
```

### Railway/Render (Backend)
```bash
# Push to Git
# Connect to Railway/Render with requirements.txt
# Set environment variables
```

---

## 👥 Team

Built with ❤️ for the hackathon

---

## 📄 License

MIT License - feel free to use and modify!

---

## 📝 Changelog

### v1.1.0 - Image Upload Feature
- ✨ Added image food identification using Gemini 2.5 Flash
- ✨ Created `/api/scan-image` endpoint for image processing
- ✨ Unified scanning button works with text OR images
- 🐛 Fixed Pydantic V2 validator deprecation warnings
- 📦 Added python-multipart for file upload support

### v1.0.0 - Initial Release
- 🎮 Text-based food scanning
- 🏆 Gamification system
- 📊 Progress tracking
- 🔐 User authentication
