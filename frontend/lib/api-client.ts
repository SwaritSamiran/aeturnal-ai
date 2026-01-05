// lib/api-client.ts
import type { UserData } from "@/app/page"

export interface ScanResult {
  success: boolean
  data?: {
    foodName: string
    sensorReadout: string
    redPill: { truth: string; vitalityDelta: number; xpDelta: number }
    bluePill: { optimization: string; vitalityDelta: number; xpDelta: number }
  }
  error?: string
}

export interface MealLogResult {
  success: boolean
  data?: { userId: string; newVitality: number; newXP: number; newGoodChoices: number; newBadChoices: number }
  error?: string
}

export async function scanFood(foodInput: string, userData: UserData, signal?: AbortSignal): Promise<ScanResult> {
  try {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ foodInput, userData: { username: userData.username, age: userData.age, weight: userData.weight, height: userData.height, medicalHistory: userData.medicalHistory, dailyActivity: userData.dailyActivity, selectedClass: userData.selectedClass } }),
      signal,
    })
    if (!response.ok) { const errorData = (await response.json()) as { error?: string }; throw new Error(errorData.error || "Backend error") }
    return (await response.json()) as ScanResult
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function uploadAndIdentifyFood(imageFile: File, userData: UserData, signal?: AbortSignal): Promise<ScanResult> {
  try {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(imageFile.type)) return { success: false, error: "Invalid file type" }
    if (imageFile.size > 10 * 1024 * 1024) return { success: false, error: "File too large" }
    const formData = new FormData()
    formData.append("file", imageFile)
    formData.append("userData", JSON.stringify({ username: userData.username, age: userData.age, weight: userData.weight, height: userData.height, medicalHistory: userData.medicalHistory, dailyActivity: userData.dailyActivity, selectedClass: userData.selectedClass }))
    const response = await fetch("/api/scan-image", { method: "POST", credentials: "include", body: formData, signal })
    if (!response.ok) { const errorData = (await response.json()) as { error?: string }; throw new Error(errorData.error || "Backend error") }
    return (await response.json()) as ScanResult
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function logMealChoice(username: string, foodName: string, choice: "red" | "blue", vitalityDelta: number, xpDelta: number, redPillTruth?: string, bluePillOptimization?: string, signal?: AbortSignal): Promise<MealLogResult> {
  try {
    const response = await fetch("/api/meal-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, foodName, choice, vitalityDelta, xpDelta, redPillTruth, bluePillOptimization }),
      signal,
    })
    if (!response.ok) { const errorData = (await response.json()) as { error?: string }; throw new Error(errorData.error || "Backend error") }
    return (await response.json()) as MealLogResult
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function validateBackendConnection(): Promise<boolean> {
  try {
    await fetch("http://localhost:8000/docs", { method: "HEAD", mode: "no-cors" })
    return true
  } catch {
    return false
  }
}
