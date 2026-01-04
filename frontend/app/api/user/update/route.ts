// app/api/user/update/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(request: NextRequest) {
  try {
    // Get auth token from cookie
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")?.value
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Create Supabase client with auth token
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { age, weight_kg, height_cm, medical_history, daily_activity, selected_class } = body

    // Update user profile (RLS will ensure user can only update their own record)
    const { data, error } = await supabase
      .from("users")
      .update({
        age: age ? parseInt(age) : null,
        weight_kg: weight_kg ? parseFloat(weight_kg) : null,
        height_cm: height_cm ? parseInt(height_cm) : null,
        medical_history: medical_history || null,
        daily_activity,
        selected_class,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data,
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    )
  }
}
