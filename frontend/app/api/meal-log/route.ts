// app/api/meal-log/route.ts
// 📝 MEAL LOGGING: Persist food choices to database

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

interface MealLogRequest {
  userId?: string
  username: string
  foodName: string
  choice: "red" | "blue"
  vitalityDelta: number
  xpDelta: number
  redPillTruth?: string
  bluePillOptimization?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Meal log request received")

    const body: MealLogRequest = await request.json()
    const { username, foodName, choice, vitalityDelta, xpDelta, redPillTruth, bluePillOptimization } = body

    if (!username || !foodName || !choice) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log(`[API] Logging meal for user: ${username}, food: ${foodName}, choice: ${choice}`)

    // 1. Get auth token from cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")?.value
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // 2. Create Supabase client with auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    )

    // 3. Get current user's ID from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("[API] Auth error:", userError)
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = user.id

    // 4. Fetch current user data
    const { data: userData, error: userFetchError } = await supabase
      .from("users")
      .select("vitality, current_xp, good_choices, bad_choices")
      .eq("id", userId)
      .single()

    if (userFetchError || !userData) {
      console.error("[API] Failed to fetch user data:", userFetchError)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // 3. Insert meal log entry
    const { error: insertError } = await supabase
      .from("meal_logs")
      .insert({
        user_id: userId,
        food_name: foodName,
        choice: choice,
        vitality_delta: vitalityDelta,
        xp_delta: xpDelta,
        red_pill_truth: redPillTruth,
        blue_pill_optimization: bluePillOptimization,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("[API] Failed to insert meal log:", insertError)
      return NextResponse.json(
        { success: false, error: "Failed to log meal" },
        { status: 500 }
      )
    }

    // 4. Update user stats
    const newVitality = Math.max(0, Math.min(100, userData.vitality + vitalityDelta))
    const newXP = userData.current_xp + xpDelta
    const isGoodChoice = choice === "blue"
    const newGoodChoices = isGoodChoice ? userData.good_choices + 1 : userData.good_choices
    const newBadChoices = isGoodChoice ? userData.bad_choices : userData.bad_choices + 1

    const { error: updateError } = await supabase
      .from("users")
      .update({
        vitality: newVitality,
        current_xp: newXP,
        good_choices: newGoodChoices,
        bad_choices: newBadChoices,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[API] Failed to update user stats:", updateError)
      // Log error but don't fail the request (meal was logged)
    }

    console.log("[API] Meal logged successfully, vitality updated to:", newVitality)

    return NextResponse.json({
      success: true,
      data: {
        userId,
        newVitality,
        newXP,
        newGoodChoices,
        newBadChoices,
      },
    })
  } catch (error) {
    console.error("[API] Meal log error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to log meal. Please try again." },
      { status: 500 }
    )
  }
}
