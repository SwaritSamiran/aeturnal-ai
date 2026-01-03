"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LandingStage } from "@/components/landing-stage"
import { OnboardingStage } from "@/components/onboarding-stage"
import { ClassSelectionStage } from "@/components/class-selection-stage"
import { DashboardStage } from "@/components/dashboard-stage"

export type Stage = "landing" | "onboarding" | "class" | "dashboard"

export type UserData = {
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
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing")
  const [userData, setUserData] = useState<UserData>({
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

  const handleInitialize = (username: string, password: string) => {
    setUserData({ ...userData, username, password })
    setStage("onboarding")
  }

  const handleReconnect = (username: string, password: string) => {
    setUserData({ ...userData, username, password })
    setStage("dashboard")
  }

  const handleBack = () => {
    if (stage === "onboarding") setStage("landing")
    else if (stage === "class") setStage("onboarding")
  }

  const handleLogout = () => {
    setStage("landing")
    setUserData({
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
    <main className="min-h-screen bg-background cyber-grid gradient-bg relative overflow-hidden">
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
