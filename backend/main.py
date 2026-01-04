import os
import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Aeturnal-AI Backend",
    description="Health-optimized food analysis with Gemini AI",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:5173",  # Vite dev
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        # Add production URLs in production environment
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)

# Initialize Google GenAI Client
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.warning("⚠️  GEMINI_API_KEY not set. Set it before making requests.")
else:
    genai.configure(api_key=API_KEY)

MODEL_ID = "gemma-3-27b-it"

# ============================================
# VALIDATION MODELS
# ============================================

class UserContext(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    selectedClass: str = Field(default="general", max_length=100)
    weight: str = Field(..., description="Weight in kg")
    height: str = Field(..., description="Height in cm")
    age: str = Field(..., description="Age in years")
    medicalHistory: str = Field(default="", max_length=500)
    dailyActivity: str = Field(..., max_length=200)

    @validator("username", "selectedClass")
    def sanitize_strings(cls, v):
        """Prevent injection attacks"""
        return v.strip()[:100]

class ScanRequest(BaseModel):
    food_item: str = Field(..., min_length=1, max_length=200)
    user_context: UserContext

    @validator("food_item")
    def sanitize_food_item(cls, v):
        """Prevent injection attacks"""
        return v.strip()[:200]

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment verification"""
    return {
        "status": "ok",
        "service": "aeturnal-ai-backend",
        "model": MODEL_ID,
        "ai_configured": API_KEY is not None
    }

@app.post("/api/scan")
async def scan_food(request: ScanRequest):
    """
    🔴 FOOD SCAN ENDPOINT
    
    Analyzes food for a specific user's health profile using Gemini AI
    
    Request: {
        "food_item": "Monster Energy Drink",
        "user_context": {...}
    }
    
    Response: {
        "sensor_readout": "...",
        "red_pill": {"truth": "...", "vitality_delta": int, "xp_delta": int},
        "blue_pill": {"optimization": "...", "vitality_delta": int, "xp_delta": int}
    }
    """
    try:
        if not API_KEY:
            logger.error("❌ AI client not configured")
            raise HTTPException(
                status_code=503,
                detail="AI service not configured. Set GEMINI_API_KEY environment variable."
            )

        logger.info(f"🔍 Analyzing food: {request.food_item} for {request.user_context.username}")

        # Simplified prompt for Gemma compatibility
        prompt = f"""Analyze this food item for health impact. Respond ONLY with valid JSON, no other text.

Food: {request.food_item}
User: {request.user_context.username}, Age {request.user_context.age}, Weight {request.user_context.weight}kg

Return JSON with this EXACT structure:
{{
  "sensor_readout": "Brief 1-sentence analysis",
  "red_pill": {{
    "truth": "Health risks (max 100 chars)",
    "vitality_delta": -10,
    "xp_delta": 10
  }},
  "blue_pill": {{
    "optimization": "Healthier alternative (max 100 chars)",
    "vitality_delta": 10,
    "xp_delta": 50
  }}
}}"""

        logger.info(f"📡 Calling Gemini API with model: {MODEL_ID}")

        # Call Gemini API
        model = genai.GenerativeModel(MODEL_ID)
        response = model.generate_content(prompt)

        # Parse and validate response
        response_text = response.text
        logger.info(f"🔍 Raw response from Gemma: {response_text[:200]}...")
        
        # Extract JSON from response (handle potential markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Try to find JSON object if not found
        if "{" in response_text:
            start = response_text.index("{")
            end = response_text.rindex("}") + 1
            response_text = response_text[start:end]
        
        logger.info(f"📦 Extracted JSON: {response_text[:200]}...")
        result = json.loads(response_text)
        logger.info(f"✅ Analysis complete for: {request.food_item}")
        
        return result

    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON from AI model: {str(e)}")
        logger.error(f"📋 Full response text: {response_text}")
        raise HTTPException(
            status_code=500,
            detail=f"AI response was not valid JSON. Full response: {response_text[:500]}"
        )
    except Exception as e:
        logger.error(f"❌ Error during food scan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Aeturnal-AI Backend...")
    print(f"📍 Server: http://0.0.0.0:8000")
    print(f"📊 Docs: http://0.0.0.0:8000/docs")
    print(f"🧠 AI Model: {MODEL_ID}")
    print(f"🔐 GEMINI_API_KEY: {'✅ Configured' if API_KEY else '❌ Not configured'}")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")






