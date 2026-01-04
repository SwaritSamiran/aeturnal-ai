# 🧬 Aeturnal-AI

> A gamified health & nutrition tracker powered by Google Gemma AI

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)
![Gemma](https://img.shields.io/badge/Gemma-3--27b--it-4285F4?logo=google)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)

---

## 🎮 What is Aeturnal-AI?

Aeturnal-AI transforms healthy eating into an RPG adventure! Scan your food and get AI-powered health insights through a unique **Red Pill / Blue Pill** choice system:

- 🔴 **Red Pill** - The truth about your food choice
- 🔵 **Blue Pill** - Healthier alternatives & optimizations

Earn XP, level up your character, and track your vitality as you make better food choices!

---

## ✨ Features

- 🤖 **AI Food Analysis** - Powered by Google Gemma 3 27B
- 🎯 **Personalized Insights** - Based on your health profile
- 🏆 **Gamification** - XP, levels, ranks & character classes
- 📊 **Progress Tracking** - Vitality scores & meal history
- 🔐 **Secure Auth** - Supabase authentication

---

## 🚀 Quick Start

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
```

### 4. Run the App

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```
Server runs at: http://localhost:8000

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
│   ├── main.py              # FastAPI server + Gemma AI
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API keys (create this!)
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities & API client
│   └── .env.local          # Supabase keys (create this!)
└── supabase/
    └── migrations/          # Database schema
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/scan` | POST | Analyze food with AI |

### Example Request

```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "food_item": "Monster Energy Drink",
    "user_context": {
      "username": "player1",
      "weight": "70",
      "height": "175",
      "age": "25",
      "dailyActivity": "moderate"
    }
  }'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.10+ |
| AI Model | Google Gemma 3 27B (via Generative AI API) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |

---

## 👥 Team

Built with ❤️ for the hackathon

---

## 📄 License

MIT License - feel free to use and modify!
