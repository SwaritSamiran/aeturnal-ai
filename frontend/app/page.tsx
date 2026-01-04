"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LandingStage } from "@/components/landing-stage"
import { OnboardingStage } from "@/components/onboarding-stage"
import { ClassSelectionStage } from "@/components/class-selection-stage"
import { DashboardStage } from "@/components/dashboard-stage"
import { createClient } from "@supabase/supabase-js"

export type Stage = "landing" | "onboarding" | "class" | "dashboard"

export type UserData = {
  id?: string
  email: string
  username: string
  password: string
  age: string
  weight: string
  height: string
  medicalHistory: string
  dailyActivity: string
  selectedClass: string
  level: number
  rank: string
  experience: number
  vitality?: number
  current_xp?: number
  good_choices?: number
  bad_choices?: number
  xp_needed?: number
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing")
  const [userData, setUserData] = useState<UserData>({
    id: "",
    email: "",
    username: "",
    password: "",
    age: "",
    weight: "",
    height: "",
    medicalHistory: "",
    dailyActivity: "",
    selectedClass: "",
    level: 1,
    rank: "NOVICE",
    experience: 0,
  })

  // On mount, check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (user && !error) {
          // User is authenticated, fetch their profile
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()
          
          if (profile) {
            setUserData({
              id: profile.id,
              email: profile.email,
              username: profile.username,
              password: "", // Don't store password in state
              age: profile.age ? String(profile.age) : "",
              weight: profile.weight_kg ? String(profile.weight_kg) : "",
              height: profile.height_cm ? String(profile.height_cm) : "",
              medicalHistory: profile.medical_history || "",
              dailyActivity: profile.daily_activity || "",
              selectedClass: profile.selected_class || "general",
              level: profile.level || 1,
              rank: profile.rank || "NOVICE",
              experience: profile.current_xp || 0,
              vitality: profile.vitality,
              current_xp: profile.current_xp,
              good_choices: profile.good_choices,
              bad_choices: profile.bad_choices,
              xp_needed: profile.xp_needed,
            })
            setStage("dashboard")
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }
    
    checkAuth()
  }, [])

  const handleInitialize = (email: string, username: string, password: string) => {
    setUserData({ ...userData, email, username, password })
    setStage("onboarding")
  }

  const handleReconnect = async (email: string, username: string, password: string) => {
    try {
      // Call login API to get user data
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      
      const result = await response.json()
      
      if (result.success && result.user) {
        // Populate userData with full user profile from database
        setUserData({
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          password: "", // Don't store password
          age: result.user.age ? String(result.user.age) : "",
          weight: result.user.weight_kg ? String(result.user.weight_kg) : "",
          height: result.user.height_cm ? String(result.user.height_cm) : "",
          medicalHistory: result.user.medical_history || "",
          dailyActivity: result.user.daily_activity || "",
          selectedClass: result.user.selected_class || "general",
          level: result.user.level || 1,
          rank: result.user.rank || "NOVICE",
          experience: result.user.current_xp || 0,
          vitality: result.user.vitality,
          current_xp: result.user.current_xp,
          good_choices: result.user.good_choices,
          bad_choices: result.user.bad_choices,
          xp_needed: result.user.xp_needed,
        })
        setStage("dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleBack = () => {
    if (stage === "onboarding") setStage("landing")
    else if (stage === "class") setStage("onboarding")
  }

  const handleLogout = () => {
    setStage("landing")
    setUserData({
      id: "",
      email: "",
      username: "",
      password: "",
      age: "",
      weight: "",
      height: "",
      medicalHistory: "",
      dailyActivity: "",
      selectedClass: "",
      level: 1,
      rank: "NOVICE",
      experience: 0,
    })
  }

  const foodIcons = ["🍜", "🥗", "🍎", "🥑", "🍗", "🥦", "🍕", "🍔", "🌮", "🍱", "🥤"]

  return (
    <main className="min-h-screen bg-background cyber-grid gradient-bg relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {foodIcons.map((food, i) => (
          <motion.div
            key={`food-${i}`}
            className="absolute text-4xl opacity-20 pixel-food"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              willChange: 'transform, opacity',
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(i) * 20, 0],
              rotate: [0, 360],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          >
            {food}
          </motion.div>
        ))}
      </div>

      {/* Existing stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              willChange: 'transform, opacity',
            }}
            animate={{
              opacity: [0.4, 0.9, 0.4],
              scale: [0.8, 1.5, 0.8],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {stage === "landing" && (
          <LandingStage key="landing" onInitialize={handleInitialize} onReconnect={handleReconnect} />
        )}
        {stage === "onboarding" && (
          <OnboardingStage
            key="onboarding"
            onNext={() => setStage("class")}
            onBack={handleBack}
            userData={userData}
            setUserData={setUserData}
          />
        )}
        {stage === "class" && (
          <ClassSelectionStage
            key="class"
            onNext={() => setStage("dashboard")}
            onBack={handleBack}
            userData={userData}
            setUserData={setUserData}
          />
        )}
        {stage === "dashboard" && (
          <DashboardStage key="dashboard" userData={userData} setUserData={setUserData} onLogout={handleLogout} />
        )}
      </AnimatePresence>
    </main>
  )
}
