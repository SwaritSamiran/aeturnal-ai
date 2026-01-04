import { supabase } from "./db"

export interface SignUpData {
  email: string
  password: string
  username: string
}

export interface SignInData {
  email: string
  password: string
}

export async function signUp({ email, password, username }: SignUpData) {
  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user")
    }

    const userId = authData.user.id

    // 2. Create user profile in database
    const { data: profileData, error: profileError } = await supabase
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
        },
      ])
      .select()
      .single()

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId)
      throw new Error("Failed to create user profile: " + profileError.message)
    }

    return { success: true, user: profileData, authUser: authData.user }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function signIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new Error(error.message)

    return { success: true, session: data.session, user: data.user }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
