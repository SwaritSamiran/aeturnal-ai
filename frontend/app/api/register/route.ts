// app/api/register/route.ts
// 🔵 BACKEND API: User Registration

import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Registration request received")

    // 1. Parse request body
    const body = await request.json()
    const { username, password } = body

    // 2. Validate input
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ success: false, error: "Username must be at least 3 characters" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 })
    }

    console.log("[v0] Validation passed, checking if username exists")

    // 3. Check if username already exists
    const existingUser = await query("SELECT id FROM users WHERE username = $1", [username])

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ success: false, error: "Username already taken" }, { status: 409 })
    }

    console.log("[v0] Username available, hashing password")

    // 4. Hash password (NEVER store plain passwords!)
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("[v0] Creating user in database")

    // 5. Insert new user
    const result = await query(
      `INSERT INTO users (username, password_hash) 
       VALUES ($1, $2) 
       RETURNING id, username, created_at, level, current_xp, rank, vitality`,
      [username, hashedPassword],
    )

    const newUser = result.rows[0]

    console.log("[v0] User created successfully:", newUser.id)

    // 6. Return success
    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          level: newUser.level,
          currentXp: newUser.current_xp,
          rank: newUser.rank,
          vitality: newUser.vitality,
          createdAt: newUser.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ success: false, error: "Registration failed. Please try again." }, { status: 500 })
  }
}
