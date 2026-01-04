// app/api/login/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing email or password" },
        { status: 400 }
      )
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      console.error("Login error:", error)
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    // Convert numeric fields to strings for frontend compatibility
    userProfile.age = userProfile.age ? String(userProfile.age) : ""
    userProfile.weight_kg = userProfile.weight_kg ? String(userProfile.weight_kg) : ""
    userProfile.height_cm = userProfile.height_cm ? String(userProfile.height_cm) : ""

    // Create session cookie
    const response = NextResponse.json({
      success: true,
      user: userProfile,
      session: data.session,
    })

    // Store session token in httpOnly cookie for security
    if (data.session) {
      response.cookies.set({
        name: "auth-token",
        value: data.session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}