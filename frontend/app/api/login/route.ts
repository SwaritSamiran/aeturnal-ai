// app/api/login/route.ts
// 🔵 BACKEND API: User Login

import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login request received")

    // 1. Parse request body
    const body = await request.json()
    const { username, password } = body

    // 2. Validate input
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    console.log("[v0] Looking up user:", username)

    // 3. Find user in database
    const result = await query(
      `SELECT id, username, password_hash, level, current_xp, xp_needed, rank, 
              vitality, max_vitality, selected_class, profile_picture, bio,
              current_streak, total_scans, good_choices, bad_choices
       FROM users 
       WHERE username = $1`,
      [username],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }

    const user = result.rows[0]

    console.log("[v0] User found, verifying password")

    // 4. Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", user.id)

    // 5. Return user data (everything frontend needs)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        currentXp: user.current_xp,
        xpNeeded: user.xp_needed,
        rank: user.rank,
        vitality: user.vitality,
        maxVitality: user.max_vitality,
        selectedClass: user.selected_class,
        profilePicture: user.profile_picture,
        bio: user.bio,
        currentStreak: user.current_streak,
        totalScans: user.total_scans,
        goodChoices: user.good_choices,
        badChoices: user.bad_choices,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed. Please try again." }, { status: 500 })
  }
}
