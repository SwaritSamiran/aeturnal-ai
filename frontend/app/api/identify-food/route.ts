// app/api/identify-food/route.ts
// 🖼️ BACKEND PROXY: Food Image Identification
// This route proxies image upload requests to your FastAPI backend

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

interface IdentifyFoodResponse {
  success: boolean
  foodName?: string
  confidence?: "high" | "medium" | "low"
  description?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API Route] /api/identify-food - Processing image upload")

    // Get the form data from the request
    const formData = await request.formData()
    const file = formData.get("file") as File

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

    // Create new form data for backend
    const backendFormData = new FormData()
    backendFormData.append("file", file)

    console.log("[API Route] Sending image to backend:", file.name)

    // Forward to FastAPI backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/identify-food`, {
      method: "POST",
      body: backendFormData,
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}))
      console.error("[API Route] Backend error:", backendResponse.status, errorData)

      return NextResponse.json(
        {
          success: false,
          error:
            errorData.detail ||
            errorData.error ||
            `Backend error: ${backendResponse.status}`,
        },
        { status: backendResponse.status }
      )
    }

    const result = (await backendResponse.json()) as IdentifyFoodResponse

    console.log("[API Route] Food identification successful:", result.foodName)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[API Route] Error processing image:", message)

    return NextResponse.json(
      {
        success: false,
        error: `Image processing failed: ${message}`,
      },
      { status: 500 }
    )
  }
}
