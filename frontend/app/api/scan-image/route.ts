// app/api/scan-image/route.ts
// 🖼️ IMAGE SCAN ROUTE: Identify food from image and analyze

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

interface ScanImageResponse {
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

export async function POST(request: NextRequest) {
  try {
    console.log("[API Route] /api/scan-image - Processing image scan")

    // Get the form data from the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userData = formData.get("userData") as string

    if (!file) {
      console.error("[API Route] No file provided")
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      )
    }

    if (!userData) {
      console.error("[API Route] No user data provided")
      return NextResponse.json(
        {
          success: false,
          error: "No user data provided",
        },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      console.error("[API Route] Invalid file type:", file.type)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Supported: JPEG, PNG, WebP, GIF",
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("[API Route] File too large:", file.size)
      return NextResponse.json(
        {
          success: false,
          error: "File too large. Maximum size: 10MB",
        },
        { status: 400 }
      )
    }

    console.log("[API Route] Identifying food from image:", file.name)

    // Step 1: Identify food from image
    const identifyFormData = new FormData()
    identifyFormData.append("file", file)

    const identifyResponse = await fetch(`${BACKEND_URL}/api/identify-food`, {
      method: "POST",
      body: identifyFormData,
    })

    if (!identifyResponse.ok) {
      const errorData = await identifyResponse.json().catch(() => ({}))
      console.error("[API Route] Food identification failed:", errorData)

      return NextResponse.json(
        {
          success: false,
          error: errorData.detail || errorData.error || "Failed to identify food from image",
        },
        { status: identifyResponse.status }
      )
    }

    const identifyResult = await identifyResponse.json()
    const foodName = identifyResult.foodName

    if (!foodName) {
      console.error("[API Route] No food identified from image")
      return NextResponse.json(
        {
          success: false,
          error: "Could not identify food from image",
        },
        { status: 400 }
      )
    }

    console.log("[API Route] Food identified:", foodName, "- Now scanning...")

    // Step 2: Scan the identified food
    const userContextData = JSON.parse(userData)

    const scanPayload = {
      food_item: foodName,
      user_context: {
        username: userContextData.username,
        age: userContextData.age,
        weight: userContextData.weight,
        height: userContextData.height,
        medicalHistory: userContextData.medicalHistory,
        dailyActivity: userContextData.dailyActivity,
        selectedClass: userContextData.selectedClass,
      },
    }

    const scanResponse = await fetch(`${BACKEND_URL}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scanPayload),
    })

    if (!scanResponse.ok) {
      const errorData = await scanResponse.json().catch(() => ({}))
      console.error("[API Route] Food scan failed:", errorData)

      return NextResponse.json(
        {
          success: false,
          error: errorData.detail || errorData.error || "Failed to analyze food",
        },
        { status: scanResponse.status }
      )
    }

    const scanResult = await scanResponse.json()

    console.log("[API Route] Food scan completed for:", foodName)

    return NextResponse.json(
      {
        success: true,
        data: {
          foodName: foodName,
          sensorReadout: scanResult.sensor_readout,
          redPill: {
            truth: scanResult.red_pill.truth,
            vitalityDelta: scanResult.red_pill.vitality_delta,
            xpDelta: scanResult.red_pill.xp_delta,
          },
          bluePill: {
            optimization: scanResult.blue_pill.optimization,
            vitalityDelta: scanResult.blue_pill.vitality_delta,
            xpDelta: scanResult.blue_pill.xp_delta,
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[API Route] Error in image scan:", message)

    return NextResponse.json(
      {
        success: false,
        error: `Image scan failed: ${message}`,
      },
      { status: 500 }
    )
  }
}
