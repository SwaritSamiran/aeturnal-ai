// app/api/register/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Debug: Check if env vars are loaded
console.log("[Register] Checking environment variables...")
console.log("[Register] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing")
console.log("[Register] SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing")

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[Register] Missing critical env vars!")
}

// Create an ADMIN-level Supabase client that bypasses RLS
// This is critical - service role key with proper configuration
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        // Service role key is implicitly admin when used this way
        // This bypasses RLS policies
      },
    },
  }
)

// Create regular client for standard operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

export async function POST(request: NextRequest) {
  try {
    console.log("[Register] POST request received")
    
    const body = await request.json()
    const { email, password, username } = body
    
    console.log("[Register] Input received:", { email: email ? "✓" : "✗", password: password ? "✓" : "✗", username: username ? "✓" : "✗" })

    if (!email || !password || !username) {
      console.log("[Register] Missing fields:", { email: !email, password: !password, username: !username })
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("[Register] Invalid email format:", email)
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // Validate password (minimum 6 chars)
    if (password.length < 6) {
      console.log("[Register] Password too short")
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if username already exists (using admin client to bypass RLS)
    console.log("[Register] Checking username availability:", username)
    const { data: existingUser, error: usernameCheckError } = await adminSupabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single()

    if (usernameCheckError && usernameCheckError.code !== "PGRST116") {
      console.error("[Register] Username check error:", usernameCheckError)
    }

    if (existingUser) {
      console.log("[Register] Username already taken:", username)
      return NextResponse.json({ success: false, error: "Username already taken" }, { status: 400 })
    }

    // 1. Create user in Supabase Auth (use admin client)
    console.log("[Register] Creating auth user:", email)
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error("[Register] Auth creation error:", authError)
      return NextResponse.json(
        { success: false, error: `Auth error: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error("[Register] Auth user not returned")
      return NextResponse.json(
        { success: false, error: "Failed to create account - no user returned" },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log("[Register] Auth user created:", userId)

    // 2. Create user profile in database (use admin client to bypass RLS)
    console.log("[Register] Creating user profile in database")
    const { data: profileData, error: profileError } = await adminSupabase
      .from("users")
      .insert([
        {
          id: userId,
          email,
          username,
          level: 1,
          rank: "NOVICE",
          current_xp: 0,
          xp_needed: 1000,
          vitality: 100,
          max_vitality: 100,
          current_streak: 0,
          total_scans: 0,
          good_choices: 0,
          bad_choices: 0,
          selected_class: "general",
        },
      ])
      .select()
      .single()

    if (profileError) {
      console.error("[Register] Profile creation error:", profileError)
      // Cleanup: delete auth user if profile creation fails
      console.log("[Register] Cleaning up auth user after profile failure")
      await adminSupabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { success: false, error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }
    
    console.log("[Register] User profile created successfully")

    // 3. Create initial achievements
    console.log("[Register] Creating initial achievements")
    const { error: achievementError } = await adminSupabase.from("achievements").insert([
      {
        user_id: userId,
        achievement_key: "account-created",
        title: "Welcome",
        description: "Account created",
      },
    ])

    if (achievementError) {
      console.warn("[Register] Achievement creation warning:", achievementError)
      // Don't fail the signup for this
    } else {
      console.log("[Register] Initial achievements created")
    }

    // 4. Create a session for the new user by signing them in
    console.log("[Register] Auto-signing user in")
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (sessionError) {
      console.warn("[Register] Session error (not critical):", sessionError)
      // User is created but can't auto-login - that's okay, they'll login manually
    } else {
      console.log("[Register] Session created successfully")
    }

    // Return success with auth token cookie if available
    const responseData = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        username,
      },
    })

    // Set auth token cookie if session was created
    if (sessionData?.session) {
      console.log("[Register] Setting auth token cookie")
      responseData.cookies.set({
        name: "auth-token",
        value: sessionData.session.access_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    console.log("[Register] Registration successful for:", email)
    return responseData
  } catch (error) {
    console.error("[Register] Server error:", error)
    return NextResponse.json({ success: false, error: `Server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
}