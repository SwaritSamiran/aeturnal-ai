"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { UserData } from "@/app/page"
import { ChevronRight, Database, ArrowLeft } from "lucide-react"

interface OnboardingStageProps {
  onNext: () => void
  onBack: () => void
  userData: UserData
  setUserData: (data: UserData) => void
}

export function OnboardingStage({ onNext, onBack, userData, setUserData }: OnboardingStageProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative z-10"
    >
      <Button
        onClick={onBack}
        variant="outline"
        className="fixed top-4 left-4 border-primary text-primary hover:bg-primary/10 neon-border bg-card/80 backdrop-blur z-50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        BACK
      </Button>

      <motion.div
        className="glass-panel border-primary neon-border rounded-lg p-6 md:p-10 max-w-2xl w-full"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-accent" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary pixel-glow">BIO-DATA SYNC</h2>
            <p className="text-sm text-muted-foreground">{"// INITIALIZING NEURAL MAPPING"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-primary text-sm">
                AGE_CYCLES
              </Label>
              <Input
                id="age"
                type="number"
                value={userData.age}
                onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                className="bg-input border-primary text-foreground neon-border h-11"
                placeholder="ENTER_VALUE"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-primary text-sm">
                MASS_KG
              </Label>
              <Input
                id="weight"
                type="number"
                value={userData.weight}
                onChange={(e) => setUserData({ ...userData, weight: e.target.value })}
                className="bg-input border-primary text-foreground neon-border h-11"
                placeholder="ENTER_VALUE"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="text-primary text-sm">
              HEIGHT_CM
            </Label>
            <Input
              id="height"
              type="number"
              value={userData.height}
              onChange={(e) => setUserData({ ...userData, height: e.target.value })}
              className="bg-input border-primary text-foreground neon-border h-11"
              placeholder="ENTER_VALUE"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity" className="text-primary text-sm">
              DAILY_PROTOCOLS
            </Label>
            <select
              id="activity"
              value={userData.dailyActivity}
              onChange={(e) => setUserData({ ...userData, dailyActivity: e.target.value })}
              className="w-full bg-input border-2 border-primary text-foreground neon-border h-11 rounded px-3 font-mono text-sm"
              required
            >
              <option value="">SELECT_ACTIVITY_LEVEL</option>
              <option value="sedentary">SEDENTARY - Minimal movement</option>
              <option value="light">LIGHT - 1-3 days/week</option>
              <option value="moderate">MODERATE - 3-5 days/week</option>
              <option value="active">ACTIVE - 6-7 days/week</option>
              <option value="extreme">EXTREME - Professional athlete</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical" className="text-primary text-sm">
              MEDICAL_HISTORY
            </Label>
            <Textarea
              id="medical"
              value={userData.medicalHistory}
              onChange={(e) => setUserData({ ...userData, medicalHistory: e.target.value })}
              className="bg-input border-primary text-foreground neon-border min-h-24 resize-none"
              placeholder="ENTER_RELEVANT_DATA..."
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border border-primary h-12 text-base font-bold"
            >
              <span className="flex items-center justify-center gap-2">
                PROCEED_TO_CLASS_SELECT
                <ChevronRight className="w-5 h-5" />
              </span>
            </Button>
          </div>

          <motion.div
            className="text-center text-xs text-accent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {">> SECURE_TRANSMISSION_ACTIVE"}
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  )
}
