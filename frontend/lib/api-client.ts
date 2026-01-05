// lib/api-client.ts
// 🔌 API CLIENT: Type-safe backend communication

import type { UserData } from "@/app/page"

/**
 * BACKEND API RESPONSE TYPES
 * These match the FastAPI backend response format
 */

export interface BackendScanResponse {
  sensor_readout: string
  red_pill: {
    title: string
    description: string
    truth: string
    vitality_delta: number
    xp_delta: number
  }
  blue_pill: {
    title: string
    description: string
    optimization: string
    vitality_delta: number
    xp_delta: number
  }
}

export interface ScanResult {
  success: boolean
  data?: {
    foodName: string
    sensorReadout: string
    redPill: {
      title: string
      description: string
      truth: string
      vitalityDelta: number
      xpDelta: number
    }
    bluePill: {
      title: string
      description: string
      optimization: string
      vitalityDelta: number
      xpDelta: number
    }
  }
  error?: string
}

export interface MealLogResult {
  success: boolean
  data?: {
    userId: string
    newVitality: number
    newXP: number
    newGoodChoices: number
    newBadChoices: number
  }
  error?: string
}

/**
 * FOOD SCAN API
 * Analyzes food using the AI backend
 */
export async function scanFood(
  foodInput: string,
  userData: UserData,
  signal?: AbortSignal
): Promise<ScanResult> {
  try {
    console.log("[API Client] Starting food scan:", foodInput)

    const response = await fetch("/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include httpOnly cookies
      body: JSON.stringify({
        foodInput,
        userData: {
          username: userData.username,
          age: userData.age,
          weight: userData.weight,
          height: userData.height,
          medicalHistory: userData.medicalHistory,
          dailyActivity: userData.dailyActivity,
          selectedClass: userData.selectedClass,
        },
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string }
      throw new Error(errorData.error || `Backend error: ${response.status}`)
    }

    const result = (await response.json()) as ScanResult
    console.log("[API Client] Scan completed:", result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[API Client] Scan error:", message)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * MEAL LOG API
 * Saves user's food choice to database
 */
export async function logMealChoice(
  username: string,
  foodName: string,
  choice: "red" | "blue",
  vitalityDelta: number,
  xpDelta: number,
  redPillTruth?: string,
  bluePillOptimization?: string,
  signal?: AbortSignal
): Promise<MealLogResult> {
  try {
    console.log("[API Client] Logging meal choice:", { foodName, choice })

    const response = await fetch("/api/meal-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include httpOnly cookies
      body: JSON.stringify({
        username,
        foodName,
        choice,
        vitalityDelta,
        xpDelta,
        redPillTruth,
        bluePillOptimization,
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string }
      throw new Error(errorData.error || `Backend error: ${response.status}`)
    }

    const result = (await response.json()) as MealLogResult
    console.log("[API Client] Meal logged successfully:", result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[API Client] Meal log error:", message)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * RETRY WITH EXPONENTIAL BACKOFF
 * For failed requests that might be transient
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${baseDelay * Math.pow(2, attempt)}ms`)

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error("Max retries exceeded")
}

/**
 * VALIDATE BACKEND CONNECTION
 * Call this on app startup to verify backend is running
 */
export async function validateBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:8000/docs", {
      method: "HEAD",
      mode: "no-cors",
    })
    console.log("[API Client] Backend connection validated")
    return true
  } catch {
    console.warn("[API Client] Backend connection failed - check if FastAPI is running")
    return false
  }
}
