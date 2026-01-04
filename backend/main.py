import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS so your Next.js app can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the Google GenAI Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_ID = "gemini-2.5-flash"  # Changed from gemma-3-27b-it as it supports JSON mode


# This matches the UserData type in your page.tsx
class UserContext(BaseModel):
    username: str
    selectedClass: str
    weight: str
    height: str
    age: str
    medicalHistory: str
    dailyActivity: str


class ScanRequest(BaseModel):
    food_item: str
    user_context: UserContext


@app.post("/api/scan")
async def scan_food(request: ScanRequest):
    try:
        # Construct the "Health Oracle" prompt with Intent-Inference
        prompt = f"""
        <start_of_turn>user
        ROLE: You are the Aeturnus-AI Biological Doctor/Oracle, a hyper-intelligent system designed to optimize human evolution.

        [SUBJECT_DOSSIER]
        - NAME: {request.user_context.username}
        - CLASS_PROTOCOL: {request.user_context.selectedClass} 
        - BIOMETRICS: {request.user_context.weight}kg / {request.user_context.height}cm / Age {request.user_context.age}
        - MEDICAL_VULNERABILITIES: {request.user_context.medicalHistory if request.user_context.medicalHistory else "None Stated"}
        - ENERGY_EXPENDITURE: {request.user_context.dailyActivity}

        [INPUT_SIGNAL]: Scanning {request.food_item}

        [PROCESSING_INSTRUCTIONS]:
        1. SIMULATE: Calculate the glycemic load and inflammatory response of {request.food_item} specifically for a {request.user_context.age}-year-old body weighing {request.user_context.weight}kg. You basically have to act like a health trainer of the user, to help them evolve according to what their current health information is, and what class they have chosen. Do not use language which the user cannot understand.
        2. ALIGNMENT: Check if this food violates the core mission of the '{request.user_context.selectedClass}' protocol.
        3. RED_PILL (The Biological Truth): If, the food really is bad for the user, provide a brutal, high-tech breakdown of how this food damages the subject's current biometrics. You have to kind of think about the intent of the user, and state that too in short. (for example, if the user is drinking monster energy drink at 12 am in the night, which of course is a very bad thing to do and is very negative for the health, but the user might really have to stay awake that night. so you need to kind of infer the intent of the user by assuming or something like that and stating it as well. that if you really need to stay awake... maybe like this. and you have to manage the blue pill accordingly as well. This was just an example). If it ain't that bad, then you can just keep it as it is, there's no need to be penalty. but you could state a better option anyway in the blue pill. You are the smartest being, you have to think and adjust the pills. You know you cannot charge a penalty if the food entered by the user is healthy for them. we will have to show the red pill in every case so that is why you are explicitly being told to take care of such situations. 
        4. BLUE_PILL (The Optimized Path): Suggest a food that achieves the same psychological craving but fulfills the '{request.user_context.selectedClass}' requirements. You have to take into consideration everything, every information about the user and give the best one for them. also along with the healthier alternative in the blue pill, you can also give a way to neutralize the red pill option if the user can't do the alternative option.
        5. CALIBRATE_REWARDS: 
        - Assign Vitality impact (-100 to +20). Harshly penalize items that trigger stated Medical Vulnerabilities.
        - Assign XP reward (0 to 100). Reward the Blue Pill significantly higher for discipline.
        6. Give everything in very structured way. you know how our app works now so you have to handle it all.
        OUTPUT ONLY VALID JSON:
        {{
        "sensor_readout": "A 1-sentence technical analysis of the food's quality.",
        "red_pill": {{ 
            "truth": "Brutal biochemical description...", 
            "vitality_delta": [DYNAMIC_INT], 
            "xp_delta": [DYNAMIC_INT] 
        }},
        "blue_pill": {{ 
            "optimization": "The superior alternative...", 
            "vitality_delta": [DYNAMIC_INT], 
            "xp_delta": [DYNAMIC_INT] 
        }}
        }}
        <end_of_turn>
        <start_of_turn>model
        """

        # EXECUTING THE BRAIN
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )

        # Prefer structured JSON if available, otherwise fall back to text
        data = getattr(response, "parsed", None)

        if data is None:
            raw_text = getattr(response, "text", None)

            # Fallback for SDK versions that don't support response_mime_type
            if not raw_text and getattr(response, "candidates", None):
                parts = response.candidates[0].content.parts or []
                raw_text = "".join(getattr(p, "text", "") for p in parts)

            if not raw_text:
                raise ValueError("Model returned empty response")

            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                raise ValueError("Model returned non-JSON response: " + raw_text[:200])

        print("Response:", data)
        return data  # Returns the JSON directly to your frontend
    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
