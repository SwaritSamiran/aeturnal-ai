// ============================================
// FOOD ANALYSIS API ROUTE
// This is where your Google Gemini model connects!
// Follows the BEGINNER_GUIDE_COMPLETE backend integration section.
// ============================================

import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Google AI with your API key
const apiKey = process.env.GOOGLE_AI_API_KEY

if (!apiKey) {
  // This will surface clearly in logs during development/deploy
  console.warn("[analyze-food] GOOGLE_AI_API_KEY is not set in environment variables.")
}

const genAI = new GoogleGenerativeAI(apiKey || "")

export async function POST(request: Request) {
  try {
    // STEP 1: Get the data from the frontend
    const body = await request.json()
    const { foodInput, userData, imageBase64 } = body

    console.log("[analyze-food] Received food scan request:", foodInput)
    console.log("[analyze-food] User data:", userData)
    if (imageBase64) {
      console.log("[analyze-food] Image payload detected (base64 length):", imageBase64.length)
    }

    if (!foodInput || !userData) {
      return NextResponse.json(
        { success: false, error: "Missing foodInput or userData" },
        { status: 400 }
      )
    }

    // STEP 2: Create the AI prompt
    // Health Oracle prompt + explicit JSON shape matching scanData in dashboard-stage.tsx
    const prompt = `
      <start_of_turn>user
      ROLE: You are the Aeturnus-AI Biological Doctor/Oracle, a hyper-intelligent system designed to optimize human evolution.

      [SUBJECT_DOSSIER]
      - NAME: ${userData.username}
      - CLASS_PROTOCOL: ${userData.selectedClass} 
      - BIOMETRICS: ${userData.weight}kg / ${userData.height}cm / Age ${userData.age}
      - MEDICAL_VULNERABILITIES: ${userData.medicalHistory || "None Stated"}
      - ENERGY_EXPENDITURE: ${userData.dailyActivity}

      [INPUT_SIGNAL]: Scanning ${foodInput}

      [PROCESSING_INSTRUCTIONS]:
      1. SIMULATE: Calculate the glycemic load and inflammatory response of ${foodInput} specifically for a ${userData.age}-year-old body weighing ${userData.weight}kg. You basically have to act like a health trainer of the user, to help them evolve according to what their current health information is, and what class they have chosen. Do not use language which the user cannot understand.
      2. ALIGNMENT: Check if this food violates the core mission of the '${userData.selectedClass}' protocol.
      3. RED_PILL (The Biological Truth): If the food is bad for the user, provide a brutal, high-tech breakdown of how this food damages the subject's current biometrics and clearly describe the negative consequences.
      4. BLUE_PILL (The Optimized Path): Suggest a food or strategy that achieves the same psychological craving but fulfills the '${userData.selectedClass}' requirements.
      5. CALIBRATE_REWARDS: 
         - Assign Vitality impact (-100 to +20). Harshly penalize items that trigger stated Medical Vulnerabilities.
         - Assign XP reward (0 to 100). Reward the Blue Pill significantly higher for discipline.
      6. Give everything in a very structured way suitable for a game UI.

      NOW FORMAT YOUR ENTIRE RESPONSE AS PURE JSON (no prose, no markdown), following this exact shape used in the frontend:

      {
        "foodName": "STRING - clear name of the food",
        "calories": NUMBER,
        "protein": NUMBER,
        "carbs": NUMBER,
        "fats": NUMBER,
        "sugar": NUMBER,
        "sodium": NUMBER,
        "ingredients": ["STRING", "STRING", ...],
        "allergens": ["STRING", "STRING", ...],
        "isHealthy": BOOLEAN,
        "healthScore": NUMBER,  
        "redPillWarnings": [
          "STRING - brutal explanation of what happens if the user takes the red pill",
          "STRING - additional consequences if helpful"
        ],
        "bluePillAlternatives": [
          "STRING - concrete blue pill alternative or protocol",
          "STRING - additional helpful options if needed"
        ],
        "personalizedAdvice": "STRING - concise, personalized advice for this user",
        "sensor_readout": "STRING - 1-sentence technical analysis of the food's quality",
        "red_pill": {
          "truth": "STRING - brutal biochemical description",
          "vitality_delta": NUMBER,
          "xp_delta": NUMBER
        },
        "blue_pill": {
          "optimization": "STRING - superior alternative description",
          "vitality_delta": NUMBER,
          "xp_delta": NUMBER
        }
      }

      IMPORTANT RULES:
      - Do NOT include any comments in the JSON.
      - Do NOT wrap the JSON in markdown fences.
      - All numeric fields must be valid numbers, not strings.
      - Always include every field shown above.

      <end_of_turn>
      <start_of_turn>model
      `

    // STEP 3: Call Google Gemini (optionally with image)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    let result

    if (imageBase64 && typeof imageBase64 === "string") {
      // imageBase64 is a data URL: data:<mime>;base64,<data>
      const match = imageBase64.match(/^data:(.*?);base64,(.*)$/)

      if (match) {
        const mimeType = match[1]
        const base64Data = match[2]

        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        }

        result = await model.generateContent([
          "You are given a food/package image. First, if the image is usable, extract nutrition label text and key ingredients, then apply the following instructions.",
          imagePart,
          prompt,
        ])
      } else {
        // Fallback to text-only if parsing fails
        result = await model.generateContent(prompt)
      }
    } else {
      // No image supplied – text-only analysis
      result = await model.generateContent(prompt)
    }
    const response = await result.response
    const text = response.text()

    console.log("[analyze-food] Raw AI Response:", text)

    // STEP 4: Parse the JSON response (strip markdown code fences if present)
    const cleanedText = text
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim()

    let analysisData: any
    try {
      analysisData = JSON.parse(cleanedText)
    } catch (err) {
      console.error("[analyze-food] Failed to parse AI JSON:", err)
      console.error("[analyze-food] Cleaned text was:", cleanedText)
      return NextResponse.json(
        { success: false, error: "AI returned non-JSON response" },
        { status: 502 }
      )
    }

    // STEP 5: Transform Health Oracle JSON into the shape
    // expected by handleScan in dashboard-stage.tsx.

    const redPill = analysisData?.red_pill || {}
    const bluePill = analysisData?.blue_pill || {}

    const transformed = {
      // Basic food meta
      foodName: (analysisData.foodName as string) || String(foodInput).toUpperCase(),

      // Macros are not part of the Health Oracle schema; default to 0
      calories: Number(analysisData.calories ?? 0),
      protein: Number(analysisData.protein ?? 0),
      carbs: Number(analysisData.carbs ?? 0),
      fats: Number(analysisData.fats ?? 0),
      sugar: Number(analysisData.sugar ?? 0),
      sodium: Number(analysisData.sodium ?? 0),

      // Lists
      ingredients: Array.isArray(analysisData.ingredients) ? analysisData.ingredients : [],
      allergens: Array.isArray(analysisData.allergens) ? analysisData.allergens : [],

      // High-level health flags
      isHealthy: Boolean(
        analysisData.isHealthy ?? (bluePill.vitality_delta ?? 0) > 0
      ),
      healthScore: Number(
        analysisData.healthScore ?? 50
      ),

      // Red/blue pill messaging as arrays for .join() in the dashboard
      redPillWarnings: redPill.truth
        ? [String(redPill.truth)]
        : ([] as string[]),
      bluePillAlternatives: bluePill.optimization
        ? [String(bluePill.optimization)]
        : ([] as string[]),

      // Main explanation line
      personalizedAdvice: String(
        analysisData.personalizedAdvice || "No advice generated."
      ),

      // Structured red/blue pill payload for the dashboard
      redPill: {
        truth: String(redPill.truth || ""),
        vitalityDelta: Number(redPill.vitality_delta ?? 0),
        xpDelta: Number(redPill.xp_delta ?? 0),
      },
      bluePill: {
        optimization: String(bluePill.optimization || ""),
        vitalityDelta: Number(bluePill.vitality_delta ?? 0),
        xpDelta: Number(bluePill.xp_delta ?? 0),
      },
    }

    // STEP 6: Return the transformed analysis to the frontend
    return NextResponse.json({
      success: true,
      data: transformed,
    })
  } catch (error) {
    console.error("[analyze-food] Error analyzing food:", error)
    return NextResponse.json(
      { success: false, error: "Failed to analyze food" },
      { status: 500 }
    )
  }
}
