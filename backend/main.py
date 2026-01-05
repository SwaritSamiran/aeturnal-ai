import os
import json
import logging
import base64
from io import BytesIO
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

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

    @field_validator("username", "selectedClass")
    @classmethod
    def sanitize_strings(cls, v):
        """Prevent injection attacks"""
        return v.strip()[:100]

class ScanRequest(BaseModel):
    food_item: str = Field(..., min_length=1, max_length=200)
    user_context: UserContext

    @field_validator("food_item")
    @classmethod
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

@app.post("/api/identify-food")
async def identify_food_from_image(file: UploadFile = File(...)):
    """
    🖼️ IMAGE FOOD IDENTIFICATION ENDPOINT
    
    Analyzes a food image using Gemini's vision capability
    and returns the identified food item name
    
    Request: Multipart form data with image file
    
    Response: {
        "success": true,
        "foodName": "Identified food item",
        "confidence": "high/medium/low"
    }
    """
    try:
        if not API_KEY:
            logger.error("❌ AI client not configured")
            raise HTTPException(
                status_code=503,
                detail="AI service not configured. Set GEMINI_API_KEY environment variable."
            )

        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Supported: JPEG, PNG, WebP, GIF"
            )

        # Read and validate file size (max 10MB)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size: 10MB"
            )

        logger.info(f"🖼️ Processing image for food identification: {file.filename}")

        # Convert image to PIL Image for validation
        try:
            image = Image.open(BytesIO(file_content))
            image.verify()
            # Reopen because verify() closes the image
            image = Image.open(BytesIO(file_content))
        except Exception as e:
            logger.error(f"❌ Invalid image file: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail="Invalid image file. Please upload a valid image."
            )

        # Use Gemini's vision capability to identify the food
        # Use gemini-2.5-flash which has vision capability and available quota
        model = genai.GenerativeModel("gemini-2.5-flash")  # Use vision-capable model
        
        prompt = """Analyze this food image and identify what food item(s) it shows. 
        
        Respond ONLY with valid JSON in this exact format:
        {
          "foodName": "Specific name of the food item (e.g., 'Monster Energy Drink', 'Pepperoni Pizza', 'Caesar Salad')",
          "confidence": "high/medium/low based on how clear the food is in the image",
          "description": "Brief 1-sentence description of what you see"
        }
        
        If you cannot identify any food, set foodName to 'Unknown Food' with confidence 'low'.
        """

        response = model.generate_content([prompt, image])
        response_text = response.text
        
        logger.info(f"🔍 Raw response from Gemini: {response_text[:200]}...")
        
        # Extract JSON from response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Try to find JSON object
        if "{" in response_text:
            start = response_text.index("{")
            end = response_text.rindex("}") + 1
            response_text = response_text[start:end]
        
        result = json.loads(response_text)
        
        logger.info(f"✅ Food identification complete: {result.get('foodName')}")
        
        return {
            "success": True,
            "foodName": result.get("foodName", "Unknown Food"),
            "confidence": result.get("confidence", "low"),
            "description": result.get("description", "")
        }

    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON from Gemini: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to parse AI response. Please try again."
        )
    except Exception as e:
        logger.error(f"❌ Error during food identification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Food identification failed: {str(e)}"
        )

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

        model = genai.GenerativeModel(MODEL_ID)

        # Enhanced prompt with personalized health analysis
        prompt = f"""Analyze this food item considering the user's specific health profile. Respond ONLY with valid JSON, no other text.

Food: {request.food_item}
User Profile:
- Name: {request.user_context.username}
- Age: {request.user_context.age}
- Weight: {request.user_context.weight}kg
- Height: {request.user_context.height}cm
- Medical History: {request.user_context.medicalHistory or 'None specified'}
- Daily Activity: {request.user_context.dailyActivity or 'moderate'}
- Health Class: {request.user_context.selectedClass or 'general'}

IMPORTANT: Consider the user's medical conditions, age, weight goals, and activity level when assessing health impact.

Return JSON with this EXACT structure:
{{
  "sensor_readout": "Personalized 1-sentence analysis based on user's health profile",
  "red_pill": {{
    "title": "Brief title for this choice (max 30 chars)",
    "description": "Context-aware explanation considering user's situation (max 80 chars)",
    "truth": "Honest assessment considering user's specific health conditions (max 100 chars)",
    "vitality_delta": 0,
    "xp_delta": 10
  }},
  "blue_pill": {{
    "title": "Brief title for healthier choice (max 30 chars)",
    "description": "Helpful alternative considering user's needs (max 80 chars)",
    "optimization": "Personalized healthier alternative based on user's profile (max 100 chars)",
    "vitality_delta": 10,
    "xp_delta": 50
  }}
}}

Personalization Rules for vitality_delta:
- Red pill: Based on food's impact for THIS specific user (-20 to +20 range)
  * If user has diabetes: High-sugar/carb foods = more negative
  * If user has hypertension: High-sodium foods = more negative  
  * If user wants weight loss: High-calorie foods = more negative
  * If user has allergies: Problematic foods = very negative
  * Healthy foods for user's conditions = positive
- Blue pill: Always suggests improvements tailored to user's health needs (+10 to +20)

For titles and descriptions:
- Consider TIME of day, user's stated needs, and real-life situations
- Be empathetic and understanding (e.g., "If you really need to stay awake...")
- Red pill titles: Acknowledge the user's potential reasons for choosing this
- Blue pill titles: Suggest practical, helpful alternatives
- Keep descriptions conversational and context-aware (max 80 chars each)"""

        response = model.generate_content(prompt)
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
        logger.error(f"📋 Full response text: {response_text if 'response_text' in locals() else 'No response text available'}")
        raise HTTPException(
            status_code=500,
            detail=f"AI response was not valid JSON. Full response: {response_text[:500] if 'response_text' in locals() else 'Response parsing failed'}"
        )
    except Exception as e:
        logger.error(f"❌ Error during food scan: {str(e)}")
        logger.error(f"📋 Response text at error: {response_text if 'response_text' in locals() else 'No response text available'}")
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






