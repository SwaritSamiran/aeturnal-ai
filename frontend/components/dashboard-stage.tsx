"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  User,
  Moon,
  Sun,
  Upload,
  Scan,
  Brain,
  X,
  CalendarIcon,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Edit,
  Shield,
  Bell,
  LogOut,
  Target,
  Award,
  BarChart3,
  CheckCircle2,
  Zap,
  XCircle,
  Lock,
  Pill,
  Loader2,
} from "lucide-react"
import { scanFood, logMealChoice } from "@/lib/api-client"
import type { UserData } from "@/app/page"

// Helper function to get achievement icon
const getAchievementIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    "account-created": "🎉",
    "first-scan": "🔍",
    "level-up": "⭐",
    "health-master": "💪",
    "streak-7": "🔥",
  }
  return iconMap[key] || "🏆"
}

type DailyChallenge = {
  id: string
  title: string
  description: string
  progress: number
  goal: number
  xpReward: number
  completed: boolean
}

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedDate?: string
}

type WeeklyReport = {
  weekStart: string
  weekEnd: string
  scansCompleted: number
  goodChoices: number
  badChoices: number
  totalXP: number
  avgVitality: number
  healthScore: number
}

interface DashboardStageProps {
  userData: UserData
  setUserData: (data: UserData) => void
  onLogout: () => void
}

interface MealEntry {
  date: string
  time: string
  food: string
  calories: number
  protein: number
  carbs: number
  fats: number
  xpGained: number
  choice?: "red" | "blue"
  isHealthy?: boolean // Added for simplified meal logging
}

export function DashboardStage({ userData, setUserData, onLogout }: DashboardStageProps) {
  const [activeTab, setActiveTab] = useState<"scanner" | "intel">("scanner")
  const [showProfile, setShowProfile] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showJourney, setShowJourney] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [vitality, setVitality] = useState(100)
  const [foodInput, setFoodInput] = useState("")
  const [scanResult, setScanResult] = useState("")
  const [showPillChoice, setShowPillChoice] = useState(false)
  const [pendingScan, setPendingScan] = useState<any>(null)
  const [screenFlash, setScreenFlash] = useState<"red" | "green" | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [isScanning, setIsScanning] = useState(false)
  const [mealHistory, setMealHistory] = useState<MealEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([
    {
      id: "scan-3-meals",
      title: "SCAN_3_MEALS",
      description: "Scan and analyze 3 different meals today",
      progress: 0,
      goal: 3,
      xpReward: 150,
      completed: false,
    },
    {
      id: "blue-pill-streak",
      title: "BLUE_PILL_STREAK",
      description: "Make 2 healthy choices in a row",
      progress: 0,
      goal: 2,
      xpReward: 200,
      completed: false,
    },
    {
      id: "morning-scan",
      title: "MORNING_WARRIOR",
      description: "Scan your breakfast before 10 AM",
      progress: 0,
      goal: 1,
      xpReward: 100,
      completed: false,
    },
  ])

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first-scan",
      title: "FIRST_SCAN",
      description: "Complete your first food scan",
      icon: "🔬",
      unlocked: false,
    },
    {
      id: "health-guardian",
      title: "HEALTH_GUARDIAN",
      description: "Make 10 blue pill choices",
      icon: "💊",
      unlocked: false,
    },
    {
      id: "week-warrior",
      title: "WEEK_WARRIOR",
      description: "Maintain 80%+ vitality for 7 days",
      icon: "⚡",
      unlocked: false,
    },
    {
      id: "scanner-master",
      title: "SCANNER_MASTER",
      description: "Complete 50 food scans",
      icon: "🎯",
      unlocked: false,
    },
    {
      id: "level-up",
      title: "LEVEL_5_ACHIEVED",
      description: "Reach level 5",
      icon: "🏆",
      unlocked: false,
    },
  ])

  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport>({
    weekStart: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0],
    weekEnd: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 6)).toISOString().split('T')[0],
    scansCompleted: 0,
    goodChoices: 0,
    badChoices: 0,
    totalXP: 0,
    avgVitality: 0,
    healthScore: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch weekly report from database
  useEffect(() => {
    const fetchWeeklyReport = async () => {
      try {
        if (!userData.id) return
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get the current week's start and end dates
        const today = new Date()
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)

        // Fetch meal logs for the week
        const { data: mealLogsData } = await supabase
          .from("meal_logs")
          .select("*")
          .eq("user_id", userData.id)
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString())

        if (mealLogsData) {
          const scansCompleted = mealLogsData.length
          const goodChoices = mealLogsData.filter(log => log.choice === 'blue').length
          const badChoices = mealLogsData.filter(log => log.choice === 'red').length
          const totalXP = mealLogsData.reduce((sum, log) => sum + (log.xp_delta || 0), 0)

          // Calculate health score based on ratio of good choices
          let healthScore = 50 // Base score
          if (scansCompleted > 0) {
            const goodChoiceRatio = goodChoices / scansCompleted
            healthScore = Math.round(50 + (goodChoiceRatio * 50)) // 50-100 scale
          }

          setWeeklyReport({
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            scansCompleted,
            goodChoices,
            badChoices,
            totalXP,
            avgVitality: vitality, // Use current vitality as average
            healthScore,
          })
        }
      } catch (error) {
        console.error("Error fetching weekly report:", error)
      }
    }

    fetchWeeklyReport()
  }, [userData.id, vitality])

  // Fetch meal logs from database for calendar
  useEffect(() => {
    const fetchMealLogs = async () => {
      try {
        if (!userData.id) return
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Fetch all meal logs for the user
        const { data: mealLogsData } = await supabase
          .from("meal_logs")
          .select("*")
          .eq("user_id", userData.id)
          .order("created_at", { ascending: false })

        if (mealLogsData && mealLogsData.length > 0) {
          // Convert meal logs from database format to MealEntry format
          const formattedMealEntries: MealEntry[] = mealLogsData.map((log) => {
            // Extract local date and time from the created_at timestamp
            const logDate = new Date(log.created_at)
            const dateString = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`
            const timeString = `${String(logDate.getHours()).padStart(2, '0')}:${String(logDate.getMinutes()).padStart(2, '0')}`
            
            return {
              date: dateString,
              time: timeString,
              food: log.food_name,
              calories: log.calories || 0,
              protein: log.protein || 0,
              carbs: log.carbs || 0,
              fats: log.fats || 0,
              xpGained: log.xp_delta || 0,
              choice: log.choice as "red" | "blue",
              isHealthy: log.choice === "blue",
            }
          })
          setMealHistory(formattedMealEntries)
        }
      } catch (error) {
        console.error("Error fetching meal logs:", error)
      }
    }

    fetchMealLogs()
  }, [userData.id])

  // Fetch achievements from database
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        if (!userData.id) return
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: achievementsData } = await supabase
          .from("achievements")
          .select("*")
          .eq("user_id", userData.id)

        if (achievementsData && achievementsData.length > 0) {
          const formattedAchievements: Achievement[] = achievementsData.map((ach) => ({
            id: ach.id,
            title: ach.achievement_key.toUpperCase(),
            description: ach.description || "",
            icon: getAchievementIcon(ach.achievement_key),
            unlocked: true,
            unlockedDate: ach.unlocked_at,
          }))
          setAchievements(formattedAchievements)
        }
      } catch (error) {
        console.error("Error fetching achievements:", error)
      }
    }

    fetchAchievements()
  }, [userData.id])

  // Fetch latest user stats on component mount
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        if (!userData.id) return
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: userStats } = await supabase
          .from("users")
          .select("vitality, current_xp, good_choices, bad_choices")
          .eq("id", userData.id)
          .single()

        if (userStats) {
          setVitality(userStats.vitality || 100)
          setUserData({
            ...userData,
            vitality: userStats.vitality,
            current_xp: userStats.current_xp,
            good_choices: userStats.good_choices,
            bad_choices: userStats.bad_choices,
          } as UserData)
        }
      } catch (error) {
        console.error("Error fetching user stats:", error)
      }
    }

    fetchUserStats()
  }, [userData.id])

  const calculateRank = (level: number): string => {
    if (level >= 50) return "MASTER"
    if (level >= 30) return "EXPERT"
    if (level >= 15) return "ADVANCED"
    if (level >= 5) return "INTERMEDIATE"
    return "NOVICE"
  }

  const toggleTheme = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleScan = async () => {
    if (!foodInput) {
      toast.error("Please enter a food name")
      return
    }

    console.log("[Dashboard] Starting food scan for:", foodInput)
    setIsScanning(true)

    try {
      const result = await scanFood(foodInput, userData)

      if (!result.success || !result.data) {
        console.error("[Dashboard] Scan failed:", result.error)
        toast.error(result.error || "Failed to analyze food")
        return
      }

      console.log("[Dashboard] Scan successful:", result.data)

      const scanData = {
        food: result.data.foodName,
        sensorReadout: result.data.sensorReadout,
        redPill: {
          truth: result.data.redPill.truth,
          vitalityDelta: result.data.redPill.vitalityDelta,
          xpDelta: result.data.redPill.xpDelta,
        },
        bluePill: {
          optimization: result.data.bluePill.optimization,
          vitalityDelta: result.data.bluePill.vitalityDelta,
          xpDelta: result.data.bluePill.xpDelta,
        },
      }

      setPendingScan(scanData)
      setScanResult(JSON.stringify(scanData, null, 2))
      setShowPillChoice(true)
      setActiveTab("intel")
      toast.success(`Analyzed: ${result.data.foodName}`)

      // Unlock first scan achievement
      if (!achievements[0].unlocked) {
        const updatedAchievements = [...achievements]
        updatedAchievements[0] = {
          ...updatedAchievements[0],
          unlocked: true,
          unlockedDate: new Date().toISOString(),
        }
        setAchievements(updatedAchievements)
      }

      // Update scan challenge
      const updatedChallenges = [...dailyChallenges]
      if (!updatedChallenges[0].completed) {
        updatedChallenges[0].progress = Math.min(updatedChallenges[0].progress + 1, updatedChallenges[0].goal)
        if (updatedChallenges[0].progress >= updatedChallenges[0].goal) {
          updatedChallenges[0].completed = true
          const newXP = userData.experience + updatedChallenges[0].xpReward
          if (newXP >= 1000) {
            setUserData({ ...userData, experience: newXP - 1000, level: userData.level + 1 })
          } else {
            setUserData({ ...userData, experience: newXP })
          }
        }
        setDailyChallenges(updatedChallenges)
      }
    } catch (error) {
      console.error("[Dashboard] Scan error:", error)
      toast.error("Error analyzing food. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  const handlePillChoice = async (choice: "red" | "blue") => {
    if (!pendingScan) {
      console.error("[Dashboard] No pending scan to process")
      return
    }

    console.log("[Dashboard] User chose:", choice)

    try {
      let vitalityDelta = 0
      let xpDelta = 0

      if (choice === "red") {
        vitalityDelta = pendingScan.redPill.vitalityDelta
        xpDelta = pendingScan.redPill.xpDelta
        setScreenFlash("red")
      } else {
        vitalityDelta = pendingScan.bluePill.vitalityDelta
        xpDelta = pendingScan.bluePill.xpDelta
        setScreenFlash("green")
      }

      console.log("[Dashboard] Logging meal choice to database...")

      const logResult = await logMealChoice(
        userData.username,
        pendingScan.food,
        choice,
        vitalityDelta,
        xpDelta,
        pendingScan.redPill?.truth,
        pendingScan.bluePill?.optimization
      )

      if (!logResult.success) {
        console.error("[Dashboard] Failed to log meal:", logResult.error)
        toast.warning("Meal saved locally but database sync failed. Retrying...")
      } else {
        console.log("[Dashboard] Meal logged successfully:", logResult.data)

        if (logResult.data) {
          setVitality(logResult.data.newVitality)
          setUserData({
            ...userData,
            experience: logResult.data.newXP,
          })

          toast.success(
            `${choice === "blue" ? "✅ Healthy choice!" : "⚠️ Indulgent choice!"} ${choice === "blue" ? "+" : "-"}${Math.abs(logResult.data.newVitality - vitality)} vitality`
          )
        }
      }

      setTimeout(() => setScreenFlash(null), 500)
      setShowPillChoice(false)
      setPendingScan(null)

      // Create local date and time strings to avoid timezone offset issues
      const now = new Date()
      const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      
      const newMeal: MealEntry = {
        date: dateString,
        time: timeString,
        food: pendingScan.food,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        xpGained: xpDelta,
        choice,
        isHealthy: choice === "blue",
      }

      setMealHistory([newMeal, ...mealHistory])
      setFoodInput("")

      // Update challenges and achievements
      const updatedChallenges = [...dailyChallenges]
      if (!updatedChallenges[1].completed) {
        if (choice === "blue") {
          updatedChallenges[1].progress = Math.min(updatedChallenges[1].progress + 1, updatedChallenges[1].goal)
          if (updatedChallenges[1].progress >= updatedChallenges[1].goal) {
            updatedChallenges[1].completed = true
            const bonusXP = updatedChallenges[1].xpReward
            const totalXP = userData.experience + bonusXP
            if (totalXP >= 1000) {
              setUserData({ ...userData, experience: totalXP - 1000, level: userData.level + 1 })
            } else {
              setUserData({ ...userData, experience: totalXP })
            }
            toast.success("Challenge completed! +200 XP")
          }
        }
        setDailyChallenges(updatedChallenges)
      }

      const updatedWeeklyReport = { ...weeklyReport }
      if (choice === "blue") {
        updatedWeeklyReport.goodChoices += 1
        updatedWeeklyReport.totalXP += xpDelta
      } else {
        updatedWeeklyReport.badChoices += 1
      }
      
      // Update health score based on current good/bad choices ratio
      const totalChoices = updatedWeeklyReport.goodChoices + updatedWeeklyReport.badChoices
      if (totalChoices > 0) {
        const goodChoiceRatio = updatedWeeklyReport.goodChoices / totalChoices
        updatedWeeklyReport.healthScore = Math.round(50 + (goodChoiceRatio * 50))
      }
      
      setWeeklyReport(updatedWeeklyReport)

      if (updatedWeeklyReport.goodChoices >= 10 && !achievements[1].unlocked) {
        const updatedAchievements = [...achievements]
        updatedAchievements[1] = {
          ...updatedAchievements[1],
          unlocked: true,
          unlockedDate: new Date().toISOString(),
        }
        setAchievements(updatedAchievements)
        toast.success("Achievement Unlocked: Health Guardian!")
      }
    } catch (error) {
      console.error("[Dashboard] Error in pill choice:", error)
      toast.error("Failed to save meal choice. Please try again.")
    }
  }

  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const days = []

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, date: null, hasMeals: false })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      // Use local date instead of UTC to avoid timezone offset issues
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const hasMeals = mealHistory.some((meal) => meal.date === dateString)
      days.push({ day: i, date: dateString, hasMeals })
    }

    return days
  }

  const goToPreviousMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCalendarDate(new Date())
  }

  const getMealsForDate = (date: string) => {
    return mealHistory.filter((meal) => meal.date === date)
  }

  const getClassDisplay = (classId: string): string => {
    const classMap: Record<string, string> = {
      "glucose-guardian": "Glucose Guardian",
      "metabolic-warrior": "Metabolic Warrior",
      "hypertrophy-titan": "Hypertrophy Titan",
      "pressure-regulator": "Pressure Regulator",
    }
    return classMap[classId] || classId
  }

  const navItems = [
    { icon: CalendarIcon, label: "CALENDAR", color: "accent", action: () => setShowCalendar(true) },
    { icon: Settings, label: "SETTINGS", color: "[#f59e0b]", action: () => setShowSettings(true) },
  ]

  const formatDate = () => {
    return currentDateTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = () => {
    return currentDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 pointer-events-none ${
              screenFlash === "red" ? "bg-red-600" : "bg-emerald-400"
            }`}
          />
        )}
      </AnimatePresence>

      {/* Fixed Navigation Bar */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-screen w-20 glass-panel border-r-2 border-accent/30 z-[500] flex flex-col items-center py-6 gap-4"
      >
        {/* Profile Button */}
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowProfile(!showProfile)
            setShowCalendar(false)
            setShowJourney(false)
            setShowSettings(false)
            setShowChallenges(false)
            setShowAchievements(false)
            setShowWeeklyReport(false)
          }}
          onMouseEnter={() => setHoveredNav("profile")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-primary/20 border-2 border-primary hover:bg-primary/30 flex items-center justify-center transition-all group"
        >
          <User className="w-6 h-6 text-primary" />
          <AnimatePresence>
            {hoveredNav === "profile" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-primary rounded-lg whitespace-nowrap text-sm font-bold text-primary shadow-lg z-[600]"
              >
                PROFILE
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Calendar Button */}
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowCalendar(!showCalendar)
            setShowProfile(false)
            setShowJourney(false)
            setShowSettings(false)
            setShowChallenges(false)
            setShowAchievements(false)
            setShowWeeklyReport(false)
          }}
          onMouseEnter={() => setHoveredNav("calendar")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-accent/20 border-2 border-accent hover:bg-accent/30 flex items-center justify-center transition-all group"
        >
          <CalendarIcon className="w-6 h-6 text-accent" />
          <AnimatePresence>
            {hoveredNav === "calendar" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-accent rounded-lg whitespace-nowrap text-sm font-bold text-accent shadow-lg z-[600]"
              >
                CALENDAR
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowChallenges(!showChallenges)
            setShowProfile(false)
            setShowCalendar(false)
            setShowJourney(false)
            setShowSettings(false)
            setShowAchievements(false)
            setShowWeeklyReport(false)
          }}
          onMouseEnter={() => setHoveredNav("challenges")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-yellow-500/20 border-2 border-yellow-500 hover:bg-yellow-500/30 flex items-center justify-center transition-all group"
        >
          <Target className="w-6 h-6 text-yellow-500" />
          {dailyChallenges.some((c) => !c.completed) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          )}
          <AnimatePresence>
            {hoveredNav === "challenges" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-yellow-500 rounded-lg whitespace-nowrap text-sm font-bold text-yellow-500 shadow-lg z-[600]"
              >
                CHALLENGES
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowAchievements(!showAchievements)
            setShowProfile(false)
            setShowCalendar(false)
            setShowJourney(false)
            setShowSettings(false)
            setShowChallenges(false)
            setShowWeeklyReport(false)
          }}
          onMouseEnter={() => setHoveredNav("achievements")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-500 hover:bg-amber-500/30 flex items-center justify-center transition-all group"
        >
          <Award className="w-6 h-6 text-amber-500" />
          <AnimatePresence>
            {hoveredNav === "achievements" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-amber-500 rounded-lg whitespace-nowrap text-sm font-bold text-amber-500 shadow-lg z-[600]"
              >
                ACHIEVEMENTS
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Journey Button */}
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowJourney(!showJourney)
            setShowProfile(false)
            setShowCalendar(false)
            setShowSettings(false)
            setShowChallenges(false)
            setShowAchievements(false)
            setShowWeeklyReport(false)
          }}
          onMouseEnter={() => setHoveredNav("journey")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-secondary/20 border-2 border-secondary hover:bg-secondary/30 flex items-center justify-center transition-all group"
        >
          <Trophy className="w-6 h-6 text-secondary" />
          <AnimatePresence>
            {hoveredNav === "journey" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-secondary rounded-lg whitespace-nowrap text-sm font-bold text-secondary shadow-lg z-[600]"
              >
                JOURNEY
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowWeeklyReport(!showWeeklyReport)
            setShowProfile(false)
            setShowCalendar(false)
            setShowJourney(false)
            setShowSettings(false)
            setShowChallenges(false)
            setShowAchievements(false)
          }}
          onMouseEnter={() => setHoveredNav("report")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 hover:bg-emerald-500/30 flex items-center justify-center transition-all group"
        >
          <BarChart3 className="w-6 h-6 text-emerald-500" />
          <AnimatePresence>
            {hoveredNav === "report" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-emerald-500 rounded-lg whitespace-nowrap text-sm font-bold text-emerald-500 shadow-lg z-[600]"
              >
                WEEKLY REPORT
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="flex-1" />

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          onMouseEnter={() => setHoveredNav("theme")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-muted/20 border-2 border-muted hover:bg-muted/30 flex items-center justify-center transition-all"
        >
          {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-blue-400" />}
          <AnimatePresence>
            {hoveredNav === "theme" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-muted rounded-lg whitespace-nowrap text-sm font-bold text-muted-foreground shadow-lg z-[600]"
              >
                THEME
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowSettings(!showSettings)
            setShowProfile(false)
            setShowCalendar(false)
            setShowJourney(false)
            setShowChallenges(false)
            setShowAchievements(false)
            setShowWeeklyReport(false)
          }}
          onMouseEnter={() => setHoveredNav("settings")}
          onMouseLeave={() => setHoveredNav(null)}
          className="relative w-12 h-12 rounded-xl bg-muted/20 border-2 border-muted hover:bg-muted/30 flex items-center justify-center transition-all"
        >
          <Settings className="w-6 h-6 text-muted-foreground" />
          <AnimatePresence>
            {hoveredNav === "settings" && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-full ml-4 px-3 py-2 bg-background border-2 border-muted rounded-lg whitespace-nowrap text-sm font-bold text-muted-foreground shadow-lg z-[600]"
              >
                SETTINGS
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Main Content Area with proper offset */}
      <div className="ml-20 min-h-screen p-4 md:p-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <div className="text-2xl md:text-3xl font-bold text-primary pixel-glow">
            {currentDateTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <motion.div
            className="text-lg md:text-xl text-accent font-mono mt-1"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {currentDateTime.toLocaleTimeString("en-US", { hour12: false })}
          </motion.div>
        </motion.div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Vitality Bar with glow effect */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel border-primary/30 rounded-lg p-6 relative overflow-hidden backdrop-blur-sm bg-background/50"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-primary pixel-glow">VITALITY</span>
                <span className="text-sm font-mono text-primary">{vitality}/100</span>
              </div>
              <div className="h-4 bg-input rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${vitality}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Experience Bar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel border-secondary/30 rounded-lg p-6 relative overflow-hidden backdrop-blur-sm bg-background/50"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-secondary pixel-glow">EXPERIENCE</span>
                <span className="text-sm font-mono text-secondary">
                  LVL {userData.level} | {userData.experience}/1000 XP
                </span>
              </div>
              <div className="h-4 bg-input rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${userData.experience}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </motion.div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">RANK: [{userData.rank}]</div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showProfile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={() => setShowProfile(false)}
              />
              <motion.div
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -400, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-20 top-0 h-screen w-96 bg-background/80 border-r-2 border-primary z-[510] p-8 overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-primary pixel-glow">PROFILE</h2>
                  <Button
                    onClick={() => setShowProfile(false)}
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary/20 border-2 border-primary/50 hover:border-primary rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex flex-col items-center mb-8">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary via-accent to-secondary border-4 border-primary/50 flex items-center justify-center mb-4 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent" />
                    <User className="w-20 h-20 text-primary-foreground relative z-10" />
                  </div>
                  <div className="flex items-center gap-2 text-accent mb-2 glass-panel border-accent px-4 py-2 rounded-full">
                    <Trophy className="w-5 h-5" />
                    <span className="font-bold">
                      LVL {userData.level} - {userData.rank}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
                    {getClassDisplay(userData.selectedClass)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-secondary pixel-glow">BIO-DATA</h3>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                      className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground neon-border transition-all"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? "SAVE" : "EDIT"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="glass-panel border-primary/30 rounded-lg p-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">AGE</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={userData.age}
                          onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                          className="bg-input border-2 border-primary text-foreground neon-border h-10 mt-2 font-bold"
                        />
                      ) : (
                        <p className="text-primary font-bold text-lg mt-1">{userData.age} years</p>
                      )}
                    </div>

                    <div className="glass-panel border-primary/30 rounded-lg p-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">WEIGHT</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={userData.weight}
                          onChange={(e) => setUserData({ ...userData, weight: e.target.value })}
                          className="bg-input border-2 border-primary text-foreground neon-border h-10 mt-2 font-bold"
                        />
                      ) : (
                        <p className="text-primary font-bold text-lg mt-1">{userData.weight} kg</p>
                      )}
                    </div>

                    <div className="glass-panel border-primary/30 rounded-lg p-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">HEIGHT</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={userData.height}
                          onChange={(e) => setUserData({ ...userData, height: e.target.value })}
                          className="bg-input border-2 border-primary text-foreground neon-border h-10 mt-2 font-bold"
                        />
                      ) : (
                        <p className="text-primary font-bold text-lg mt-1">{userData.height} cm</p>
                      )}
                    </div>

                    <div className="glass-panel border-primary/30 rounded-lg p-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        ACTIVITY LEVEL
                      </Label>
                      {isEditing ? (
                        <select
                          value={userData.dailyActivity}
                          onChange={(e) => setUserData({ ...userData, dailyActivity: e.target.value })}
                          className="w-full bg-input border-2 border-primary text-foreground neon-border h-10 rounded-lg px-3 font-bold text-sm mt-2"
                        >
                          <option value="sedentary">SEDENTARY</option>
                          <option value="light">LIGHT</option>
                          <option value="moderate">MODERATE</option>
                          <option value="active">ACTIVE</option>
                          <option value="extreme">EXTREME</option>
                        </select>
                      ) : (
                        <p className="text-primary font-bold text-lg mt-1 uppercase">{userData.dailyActivity}</p>
                      )}
                    </div>

                    <div className="glass-panel border-primary/30 rounded-lg p-4">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        MEDICAL HISTORY
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={userData.medicalHistory}
                          onChange={(e) => setUserData({ ...userData, medicalHistory: e.target.value })}
                          className="bg-input border-2 border-primary text-foreground neon-border min-h-24 resize-none mt-2 text-sm font-mono"
                        />
                      ) : (
                        <p className="text-primary text-sm mt-2 font-mono">
                          {userData.medicalHistory || "None recorded"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Calendar Modal with navigation */}
        <AnimatePresence>
          {showCalendar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => {
                  setShowCalendar(false)
                  setSelectedDate(null)
                }}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl max-h-[90vh] glass-panel border-2 border-accent z-50 p-8 overflow-y-auto shadow-2xl rounded-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-accent pixel-glow">MEAL_CALENDAR</h2>
                  <Button
                    onClick={() => {
                      setShowCalendar(false)
                      setSelectedDate(null)
                    }}
                    variant="ghost"
                    size="icon"
                    className="text-accent hover:bg-accent/20 border-2 border-accent/50 hover:border-accent rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {!selectedDate ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <Button
                        onClick={goToPreviousMonth}
                        variant="outline"
                        size="icon"
                        className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-primary">
                          {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </h3>
                        <Button
                          onClick={goToToday}
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-accent mt-1"
                        >
                          TODAY
                        </Button>
                      </div>
                      <Button
                        onClick={goToNextMonth}
                        variant="outline"
                        size="icon"
                        className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                        <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {generateCalendarDays().map((day, index) => (
                        <button
                          key={index}
                          onClick={() => day.date && setSelectedDate(day.date)}
                          disabled={!day.date}
                          className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed ${
                            day.hasMeals
                              ? "border-accent bg-accent/20 text-accent font-bold"
                              : "border-muted bg-muted/10 text-muted-foreground"
                          }`}
                        >
                          {day.day && (
                            <>
                              <span className="text-xl">{day.day}</span>
                              {day.hasMeals && <div className="w-2 h-2 rounded-full bg-accent mt-1" />}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setSelectedDate(null)}
                      variant="outline"
                      className="mb-4 border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      ← BACK_TO_CALENDAR
                    </Button>
                    <h3 className="text-xl font-bold text-primary mb-4">
                      MEALS_FOR:{" "}
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                    {getMealsForDate(selectedDate).length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">NO_MEALS_LOGGED</p>
                    ) : (
                      <div className="space-y-4">
                        {getMealsForDate(selectedDate).map((meal, index) => (
                          <div key={index} className="glass-panel border-primary/30 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-lg font-bold text-primary">{meal.food}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{meal.time}</p>
                              </div>
                              {meal.choice && (
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    meal.choice === "blue"
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500"
                                      : "bg-red-500/20 text-red-400 border border-red-500"
                                  }`}
                                >
                                  {meal.choice === "blue" ? "BLUE_PILL" : "RED_PILL"}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">CALORIES</p>
                                <p className="text-accent font-bold">{meal.calories} kcal</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">PROTEIN</p>
                                <p className="text-accent font-bold">{meal.protein}g</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">CARBS</p>
                                <p className="text-accent font-bold">{meal.carbs}g</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">FATS</p>
                                <p className="text-accent font-bold">{meal.fats}g</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">XP_GAINED</p>
                                <p className={`font-bold ${meal.xpGained > 0 ? "text-secondary" : "text-red-400"}`}>
                                  {meal.xpGained > 0 ? `+${meal.xpGained}` : meal.xpGained} XP
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showJourney && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowJourney(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl max-h-[90vh] glass-panel border-2 border-secondary z-50 p-8 overflow-y-auto shadow-2xl rounded-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-secondary pixel-glow">YOUR_JOURNEY</h2>
                  <Button
                    onClick={() => setShowJourney(false)}
                    variant="ghost"
                    size="icon"
                    className="text-secondary hover:bg-secondary/20 border-2 border-secondary/50 hover:border-secondary rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="glass-panel border-primary/30 rounded-lg p-6 text-center">
                    <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
                    <h3 className="text-4xl font-bold text-primary mb-2">LEVEL {userData.level}</h3>
                    <p className="text-2xl text-accent font-bold mb-4">{userData.rank}</p>
                    <p className="text-muted-foreground">CLASS: {getClassDisplay(userData.selectedClass)}</p>
                  </div>

                  <div className="glass-panel border-accent/30 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-accent mb-4">PROGRESS_TO_NEXT_LEVEL</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">EXPERIENCE</span>
                        <span className="text-secondary font-bold">{userData.experience}/1000 XP</span>
                      </div>
                      <div className="h-3 bg-muted/30 rounded-full overflow-hidden border-2 border-secondary/50">
                        <motion.div
                          className="h-full bg-gradient-to-r from-secondary to-accent"
                          animate={{ width: `${userData.experience}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel border-primary/30 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-primary mb-4">RANK_PROGRESSION</h4>
                    <div className="space-y-3">
                      {["NOVICE", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER"].map((rank) => (
                        <div
                          key={rank}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            userData.rank === rank ? "bg-accent/20 border-2 border-accent" : "bg-muted/10"
                          }`}
                        >
                          <span
                            className={`font-bold ${userData.rank === rank ? "text-accent" : "text-muted-foreground"}`}
                          >
                            {rank}
                          </span>
                          {userData.rank === rank && <Shield className="w-5 h-5 text-accent" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel border-secondary/30 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-secondary mb-4">STATS</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TOTAL_MEALS_SCANNED</span>
                        <span className="text-primary font-bold">{mealHistory.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TOTAL_XP_EARNED</span>
                        <span className="text-secondary font-bold">
                          {mealHistory.reduce((sum, meal) => sum + meal.xpGained, 0)} XP
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VITALITY_STATUS</span>
                        <span className="text-accent font-bold">OPTIMAL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettings && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setShowSettings(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md glass-panel border-2 border-[#f59e0b] z-50 p-8 shadow-2xl rounded-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#f59e0b] pixel-glow">SETTINGS</h2>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="ghost"
                    size="icon"
                    className="text-[#f59e0b] hover:bg-[#f59e0b]/20 border-2 border-[#f59e0b]/50 hover:border-[#f59e0b] rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      toggleTheme()
                      setShowSettings(false)
                    }}
                    className="w-full glass-panel border-accent/30 rounded-lg p-4 hover:border-accent transition-all flex items-center gap-3"
                  >
                    {darkMode ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-accent" />}
                    <div className="text-left">
                      <p className="font-bold text-accent">THEME_MODE</p>
                      <p className="text-xs text-muted-foreground">CURRENT: {darkMode ? "DARK" : "LIGHT"}</p>
                    </div>
                  </button>

                  <button className="w-full glass-panel border-primary/30 rounded-lg p-4 hover:border-primary transition-all flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-bold text-primary">NOTIFICATIONS</p>
                      <p className="text-xs text-muted-foreground">MANAGE_ALERTS</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false)
                      onLogout()
                    }}
                    className="w-full glass-panel border-red-500/30 rounded-lg p-4 hover:border-red-500 transition-all flex items-center gap-3 group"
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                    <div className="text-left">
                      <p className="font-bold text-red-500">LOGOUT</p>
                      <p className="text-xs text-muted-foreground">DISCONNECT_SESSION</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="glass-panel border-primary/30 neon-border rounded-2xl p-6 md:p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-8 h-8 text-accent" />
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary pixel-glow">AETURNAL_CORE</h2>
                <p className="text-sm text-muted-foreground">{"// DEEP_MATTER_ANALYSIS_SYSTEM"}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setActiveTab("scanner")}
                className={`flex-1 h-12 font-bold transition-all ${
                  activeTab === "scanner"
                    ? "bg-accent text-accent-foreground neon-border border-accent"
                    : "bg-input text-muted-foreground border-2 border-input hover:border-accent/50"
                }`}
              >
                <Scan className="w-5 h-5 mr-2" />
                SCANNER
              </Button>
              <Button
                onClick={() => setActiveTab("intel")}
                className={`flex-1 h-12 font-bold transition-all ${
                  activeTab === "intel"
                    ? "bg-secondary text-secondary-foreground neon-border border-secondary"
                    : "bg-input text-muted-foreground border-2 border-input hover:border-secondary/50"
                }`}
              >
                <Brain className="w-5 h-5 mr-2" />
                INTEL
              </Button>
            </div>

            <div className="min-h-96">
              {activeTab === "scanner" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="glass-panel border-accent neon-border rounded-lg p-4 bg-gradient-to-r from-accent/10 to-secondary/10">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl pixel-food">🍜</div>
                      <div>
                        <h3 className="text-lg font-bold text-accent">FOOD_NEURAL_SCANNER</h3>
                        <p className="text-xs text-muted-foreground">
                          {"// SCAN_NUTRITION_LABELS_&_PACKAGE_INGREDIENTS"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel border-accent neon-border rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-2">
                          🔍 INPUT_FOOD_DATA:
                        </Label>
                        <Input
                          value={foodInput}
                          onChange={(e) => setFoodInput(e.target.value)}
                          placeholder="E.g., Monster Energy Drink, Doritos, Pizza..."
                          className="bg-input border-accent text-foreground neon-border h-12"
                        />
                      </div>

                      <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors hover:bg-accent/5">
                        <div className="text-5xl mb-2">📦</div>
                        <Upload className="w-12 h-12 text-accent mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-bold">UPLOAD_PACKAGE_IMAGE</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {"// SCAN_NUTRITION_LABEL_OR_INGREDIENT_LIST"}
                        </p>
                        <p className="text-xs text-accent/70 mt-2">{"Supported: JPG, PNG, PDF"}</p>
                      </div>

                      <Button
                        onClick={handleScan}
                        disabled={!foodInput || isScanning}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 neon-border border-accent h-12 font-bold disabled:opacity-50"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ANALYZING...
                          </>
                        ) : (
                          <>
                            🧬 ANALYZE_FOOD
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="glass-panel border-accent/30 rounded-lg p-4 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="text-xl">💡</div>
                      <div>
                        <p className="text-accent font-bold mb-1">
                          CLASS_TIP: [{getClassDisplay(userData.selectedClass)}]
                        </p>
                        <p className="text-muted-foreground">
                          {userData.selectedClass === "glucose-guardian" &&
                            "Monitor sugar content in scanned foods. High sugar = vitality loss!"}
                          {userData.selectedClass === "metabolic-warrior" &&
                            "Track calories! Maintain deficit for maximum XP gains."}
                          {userData.selectedClass === "hypertrophy-titan" &&
                            "Prioritize protein! 20g+ per meal = bonus XP."}
                          {userData.selectedClass === "pressure-regulator" &&
                            "Watch sodium levels! <2000mg daily recommended."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-center text-muted-foreground">
                    🎮 CLASS: [{getClassDisplay(userData.selectedClass)}] | 📅 AGE: [{userData.age}] | ⚖️ MASS: [
                    {userData.weight}
                    KG]
                  </div>
                </motion.div>
              )}

              {activeTab === "intel" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="glass-panel border-secondary neon-border rounded-lg p-6">
                    <h3 className="text-lg font-bold text-secondary mb-4">ANALYSIS_OUTPUT</h3>

                    {scanResult ? (
                      <Textarea
                        value={scanResult}
                        readOnly
                        className="bg-input border-secondary text-foreground neon-border min-h-80 font-mono text-sm resize-none"
                      />
                    ) : (
                      <div className="min-h-80 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>{">> AWAITING_SCAN_DATA"}</p>
                          <p className="text-xs mt-2">{"// INITIATE_SCAN_TO_BEGIN"}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {scanResult && (
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 neon-border border-secondary h-12 font-bold">
                      SAVE_TO_ARCHIVE
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showChallenges && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
            onClick={() => setShowChallenges(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel border-yellow-500 neon-border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-yellow-500 pixel-glow">DAILY_CHALLENGES</h2>
                </div>
                <Button
                  onClick={() => setShowChallenges(false)}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-4">
                {dailyChallenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`glass-panel rounded-lg p-4 ${
                      challenge.completed
                        ? "border-2 border-emerald-500 bg-emerald-500/10"
                        : "border-2 border-yellow-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground">{challenge.title}</h3>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                      {challenge.completed && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          PROGRESS: {challenge.progress}/{challenge.goal}
                        </span>
                        <span className="text-yellow-500 font-bold">+{challenge.xpReward} XP</span>
                      </div>
                      <div className="h-2 bg-input rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                          className="h-full bg-gradient-to-r from-yellow-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 glass-panel border-2 border-yellow-500/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  {"// CHALLENGES_RESET_DAILY_AT_00:00"}
                  <br />
                  {"// COMPLETE_FOR_BONUS_XP"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel border-amber-500 neon-border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-500" />
                  <h2 className="text-2xl font-bold text-amber-500 pixel-glow">ACHIEVEMENTS</h2>
                </div>
                <Button
                  onClick={() => setShowAchievements(false)}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className={`glass-panel rounded-lg p-4 text-center transition-all ${
                      achievement.unlocked
                        ? "border-2 border-amber-500 bg-gradient-to-br from-amber-500/20 to-yellow-500/10"
                        : "border-2 border-muted/30 opacity-50 grayscale"
                    }`}
                  >
                    <div className="text-5xl mb-2">{achievement.icon}</div>
                    <h3 className="font-bold text-foreground mb-1">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedDate && (
                      <p className="text-xs text-amber-500 mt-2">
                        UNLOCKED: {new Date(achievement.unlockedDate).toLocaleDateString()}
                      </p>
                    )}
                    {!achievement.unlocked && <Lock className="w-4 h-4 mx-auto mt-2 text-muted-foreground" />}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 glass-panel border-2 border-amber-500/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  {"// UNLOCK_ACHIEVEMENTS_BY_REACHING_MILESTONES"}
                  <br />
                  {"// SHOW_OFF_YOUR_PROGRESS"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeeklyReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
            onClick={() => setShowWeeklyReport(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel border-emerald-500 neon-border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-emerald-500" />
                  <h2 className="text-2xl font-bold text-emerald-500 pixel-glow">WEEKLY_HEALTH_REPORT</h2>
                </div>
                <Button
                  onClick={() => setShowWeeklyReport(false)}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="text-center p-4 glass-panel border-2 border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">REPORTING_PERIOD</p>
                  <p className="text-lg font-bold text-foreground">
                    {weeklyReport.weekStart} - {weeklyReport.weekEnd}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel border-2 border-primary/30 rounded-lg p-4 text-center">
                    <Scan className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-3xl font-bold text-primary">{weeklyReport.scansCompleted}</p>
                    <p className="text-xs text-muted-foreground">SCANS_COMPLETED</p>
                  </div>

                  <div className="glass-panel border-2 border-secondary/30 rounded-lg p-4 text-center">
                    <Zap className="w-8 h-8 text-secondary mx-auto mb-2" />
                    <p className="text-3xl font-bold text-secondary">{weeklyReport.totalXP}</p>
                    <p className="text-xs text-muted-foreground">TOTAL_XP_EARNED</p>
                  </div>

                  <div className="glass-panel border-2 border-emerald-500/30 rounded-lg p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-emerald-500">{weeklyReport.goodChoices}</p>
                    <p className="text-xs text-muted-foreground">BLUE_PILLS</p>
                  </div>

                  <div className="glass-panel border-2 border-red-500/30 rounded-lg p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-500">{weeklyReport.badChoices}</p>
                    <p className="text-xs text-muted-foreground">RED_PILLS</p>
                  </div>
                </div>

                <div className="glass-panel border-2 border-accent/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">AVG_VITALITY</span>
                    <span className="text-lg font-bold text-accent">{weeklyReport.avgVitality}%</span>
                  </div>
                  <div className="h-3 bg-input rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyReport.avgVitality}%` }}
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                    />
                  </div>
                </div>

                <div className="glass-panel border-2 border-secondary/30 rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">HEALTH_SCORE</p>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-bold text-secondary pixel-glow"
                  >
                    {weeklyReport.healthScore}
                  </motion.p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {weeklyReport.healthScore >= 80 && "EXCELLENT! Keep it up!"}
                    {weeklyReport.healthScore >= 60 && weeklyReport.healthScore < 80 && "GOOD! You're on track."}
                    {weeklyReport.healthScore < 60 && "NEEDS_IMPROVEMENT. Try more blue pills!"}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 glass-panel border-2 border-emerald-500/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  {"// REPORTS_GENERATED_WEEKLY"}
                  <br />
                  {"// TRACK_YOUR_HEALTH_JOURNEY"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPillChoice && pendingScan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              onClick={() => {
                setShowPillChoice(false)
                setPendingScan(null)
              }}
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateX: -90 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl glass-panel border-2 border-accent z-[70] p-8 rounded-2xl shadow-2xl"
            >
              <div className="text-center mb-8">
                <motion.h2
                  className="text-3xl md:text-4xl font-bold text-accent pixel-glow mb-4"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  MAKE_YOUR_CHOICE
                </motion.h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  {pendingScan.isHealthy
                    ? ">> FOOD_SCAN: Nutritional profile OPTIMAL. Select your path forward."
                    : ">> WARNING: Health markers indicate SUBOPTIMAL consumption. Choose wisely."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-center text-red-500 font-bold mb-2 text-lg">Red Pill</h4>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePillChoice("red")}
                    className="group relative glass-panel border-2 border-red-500 hover:border-red-400 rounded-xl p-6 transition-all"
                  >
                  <div className="absolute inset-0 bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500">
                        <Pill className="w-8 h-8 text-red-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-red-500 mb-2">{pendingScan.redPill.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{pendingScan.redPill.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-red-400">
                        <span>•</span>
                        <span>VITALITY: {pendingScan.redPill.vitalityDelta > 0 ? '+' : ''}{pendingScan.redPill.vitalityDelta}</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400">
                        <span>•</span>
                        <span>EXPERIENCE: +{pendingScan.redPill.xpDelta} XP</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-3 px-2">
                        {pendingScan.redPill.truth}
                      </div>
                    </div>
                  </div>
                </motion.button>
                </div>

                <div>
                  <h4 className="text-center text-blue-500 font-bold mb-2 text-lg">Blue Pill</h4>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePillChoice("blue")}
                    className="group relative glass-panel border-2 border-blue-500 hover:border-blue-400 rounded-xl p-6 transition-all"
                  >
                  <div className="absolute inset-0 bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500">
                        <Pill className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-blue-500 mb-2">{pendingScan.bluePill.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{pendingScan.bluePill.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-blue-400">
                        <span>•</span>
                        <span>VITALITY: +{pendingScan.bluePill.vitalityDelta}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400">
                        <span>•</span>
                        <span>EXPERIENCE: +{pendingScan.bluePill.xpDelta} XP</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-3 px-2">
                        {pendingScan.bluePill.optimization}
                      </div>
                    </div>
                  </div>
                </motion.button>
                </div>
              </div>

              <motion.div
                className="mt-6 text-center text-xs text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                {"// REMEMBER: Every choice shapes your biological destiny"}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Placeholder for the existing Pill Choice Modal, which is now handled by screenFlash and the main scanner logic */}
      {/* The logic for showing the pill choice is now integrated into handleScan and handlePillChoice */}
    </div>
  )
}
