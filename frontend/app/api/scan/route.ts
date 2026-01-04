// app/api/scan/route.ts
// 🔴 BACKEND PROXY: Food Scan Analysis
// This route proxies requests to your FastAPI backend

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

interface ScanRequest {
  foodInput: string
  imageFile?: string | null
  userData: {
    username: string
    age: string
    weight: string
    height: string
    medicalHistory: string
    dailyActivity: string
    selectedClass: string
  }
}

interface BackendScanResponse {
  sensor_readout: string
  red_pill: {
    truth: string
    vitality_delta: number
    xp_delta: number
  }
  blue_pill: {
    optimization: string
    vitality_delta: number
    xp_delta: number
  }
}

interface FrontendScanResponse {
  success: boolean
  data?: {
    foodName: string
    sensorReadout: string
    redPill: {
      truth: string
      vitalityDelta: number
      xpDelta: number
    }
    bluePill: {
      optimization: string
      vitalityDelta: number
      xpDelta: number
    }
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<FrontendScanResponse>> {
  try {
    console.log("[API] Scan request received")

    // 1. Parse and validate request
    const body: ScanRequest = await request.json()
    const { foodInput, userData } = body

    if (!foodInput || !userData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 2. Get auth token from request headers (optional but recommended for production)
    // In production, validate JWT token from Supabase here
    // const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    console.log(`[API] Scanning food: ${foodInput} for user: ${userData.username}`)

    // 3. Call FastAPI backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth header in production:
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        food_item: foodInput,
        user_context: {
          username: userData.username,
          selectedClass: userData.selectedClass,
          weight: userData.weight,
          height: userData.height,
          age: userData.age,
          medicalHistory: userData.medicalHistory,
          dailyActivity: userData.dailyActivity,
        },
      }),
    })

    // 4. Handle backend errors
    if (!backendResponse.ok) {
      const errorData = await backendResponse.text()
      console.error(`[API] Backend error: ${backendResponse.status} - ${errorData}`)
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${backendResponse.status}. Please try again.`,
        },
        { status: backendResponse.status }
      )
    }

    // 5. Parse backend response
    const backendData: BackendScanResponse = await backendResponse.json()

    console.log("[API] Backend response received successfully")

    // 6. Transform to frontend format (snake_case → camelCase)
    const response: FrontendScanResponse = {
      success: true,
      data: {
        foodName: foodInput,
        sensorReadout: backendData.sensor_readout,
        redPill: {
          truth: backendData.red_pill.truth,
          vitalityDelta: backendData.red_pill.vitality_delta,
          xpDelta: backendData.red_pill.xp_delta,
        },
        bluePill: {
          optimization: backendData.blue_pill.optimization,
          vitalityDelta: backendData.blue_pill.vitality_delta,
          xpDelta: backendData.blue_pill.xp_delta,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[API] Scan error:", error)

    // Check if it's a network error (backend not running)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          error: "Backend service is not running. Make sure FastAPI is running on port 8000.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to analyze food. Please try again." },
      { status: 500 }
    )
  }
}
