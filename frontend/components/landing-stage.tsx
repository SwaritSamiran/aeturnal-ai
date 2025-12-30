"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, Activity, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"

interface LandingStageProps {
  onInitialize: (username: string, password: string) => void
  onReconnect: (username: string, password: string) => void
}

export function LandingStage({ onInitialize, onReconnect }: LandingStageProps) {
  const [bioBattery, setBioBattery] = useState(85)
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setBioBattery((prev) => {
        const change = Math.random() * 10 - 5
        const newValue = prev + change
        return Math.max(85, Math.min(100, newValue))
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const handleSignupSubmit = () => {
    if (username && password && password === confirmPassword) {
      onInitialize(username, password)
    }
  }

  const handleLoginSubmit = () => {
    if (username && password) {
      onReconnect(username, password)
    }
  }

  const handleBack = () => {
    setShowSignup(false)
    setShowLogin(false)
    setUsername("")
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="text-center mb-12"
      >
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 pixel-glow text-primary"
          animate={{
            textShadow: [
              "0 0 5px currentColor, 0 0 10px currentColor",
              "0 0 8px currentColor, 0 0 15px currentColor",
              "0 0 5px currentColor, 0 0 10px currentColor",
            ],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        >
          AETURNUS-AI
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-accent font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {"// LEVEL UP YOUR BIOLOGY. SCAN TO EVOLVE."}
        </motion.p>
      </motion.div>

      <motion.div
        className="glass-panel border-primary neon-border rounded-lg p-8 md:p-12 max-w-md w-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-6">
          <Activity className="w-12 h-12 text-secondary animate-pulse" />
        </div>

        <div className="mb-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">{">> BIO-BATTERY"}</div>
          <div className="h-2 bg-input rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%]"
              animate={{
                width: `${bioBattery}%`,
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                width: { duration: 0.5 },
                backgroundPosition: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
              }}
            />
          </div>
          <motion.div
            className="text-xs text-primary mt-1"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            [{bioBattery.toFixed(1)}%]
          </motion.div>
        </div>

        {!showSignup && !showLogin ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowSignup(true)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border border-primary h-12 text-base font-bold relative overflow-hidden group"
            >
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                INITIALIZE LINK
              </span>
            </Button>

            <Button
              onClick={() => setShowLogin(true)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border border-primary h-12 text-base font-bold relative overflow-hidden group"
            >
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                RECONNECT
              </span>
            </Button>
          </div>
        ) : showSignup ? (
          <div className="space-y-4">
            <Button onClick={handleBack} variant="ghost" className="mb-2 text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Button>
            <div className="text-center text-sm text-primary mb-4 font-bold">{">> SIGN UP"}</div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">USERNAME</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background/50 border-primary/50 text-foreground"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">PASSWORD</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-primary/50 text-foreground"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">CONFIRM PASSWORD</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50 border-primary/50 text-foreground"
                placeholder="Confirm password"
              />
            </div>
            <Button
              onClick={handleSignupSubmit}
              disabled={!username || !password || password !== confirmPassword}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border border-primary h-12 text-base font-bold"
            >
              CREATE ACCOUNT
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button onClick={handleBack} variant="ghost" className="mb-2 text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Button>
            <div className="text-center text-sm text-primary mb-4 font-bold">{">> LOG IN"}</div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">USERNAME</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background/50 border-primary/50 text-foreground"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">PASSWORD</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-primary/50 text-foreground"
                placeholder="Enter password"
              />
            </div>
            <Button
              onClick={handleLoginSubmit}
              disabled={!username || !password}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border border-primary h-12 text-base font-bold"
            >
              ACCESS SYSTEM
            </Button>
          </div>
        )}

        <motion.div
          className="mt-6 text-center text-xs text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {"// SYSTEM ONLINE. AWAITING USER AUTH1ACOLS.."}
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-8 flex items-center gap-4 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>PROTOCOLS: ACTIVE</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
