// app/api/register/route.ts
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/db" // Import supabase client instead of query

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 })
    }

    // 1. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 2. Insert user using Supabase syntax
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          username, 
          password_hash: hashedPassword,
          level: 1,
          current_xp: 0,
          xp_needed: 100,
          rank: "Novice"
        }
      ])
      .select()
      .single()

    if (error) {
      console.error("Signup error:", error)
      return NextResponse.json({ success: false, error: "User already exists or DB error" }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}