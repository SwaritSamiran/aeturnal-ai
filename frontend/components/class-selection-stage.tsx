"use client"

import { useState } from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { UserData } from "@/app/page"
import { Droplets, Scale, Dumbbell, Heart, ArrowLeft } from "lucide-react"

interface ClassSelectionStageProps {
  onNext: () => void
  onBack: () => void
  userData: UserData
  setUserData: (data: UserData) => void
}

const classes = [
  {
    id: "glucose-guardian",
    name: "GLUCOSE GUARDIAN",
    icon: Droplets,
    color: "text-primary",
    borderColor: "border-primary",
    description: "MASTER_BLOOD_SUGAR_CONTROL",
    focus: "Diabetes Management",
  },
  {
    id: "metabolic-warrior",
    name: "METABOLIC WARRIOR",
    icon: Scale,
    color: "text-secondary",
    borderColor: "border-secondary",
    description: "OPTIMIZE_FAT_BURNING_PATHWAYS",
    focus: "Weight Loss",
  },
  {
    id: "hypertrophy-titan",
    name: "HYPERTROPHY TITAN",
    icon: Dumbbell,
    color: "text-accent",
    borderColor: "border-accent",
    description: "MAXIMIZE_MUSCLE_SYNTHESIS",
    focus: "Muscle Gain",
  },
  {
    id: "pressure-regulator",
    name: "PRESSURE REGULATOR",
    icon: Heart,
    borderColor: "border-[#ec4899]",
    color: "text-[#ec4899]",
    description: "BALANCE_CARDIOVASCULAR_FLOW",
    focus: "Blood Pressure",
  },
]

export function ClassSelectionStage({ onNext, onBack, userData, setUserData }: ClassSelectionStageProps) {
  const [selected, setSelected] = useState<string>("")

  const handleSelect = (classId: string) => {
    setSelected(classId)
    setUserData({ ...userData, selectedClass: classId })
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

      <motion.div className="max-w-6xl w-full" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-primary pixel-glow mb-3">CHOOSE YOUR PATH</h2>
          <p className="text-accent text-sm md:text-base">{"// SELECT_HEALTH_SPECIALIZATION"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {classes.map((classItem, index) => {
            const Icon = classItem.icon
            const isSelected = selected === classItem.id

            return (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                onClick={() => handleSelect(classItem.id)}
                className={`glass-panel ${classItem.borderColor} neon-border rounded-lg p-8 cursor-pointer transition-all ${
                  isSelected ? "ring-4 ring-current" : ""
                }`}
              >
                <div className={`flex flex-col items-center text-center ${classItem.color}`}>
                  <Icon className="w-20 h-20 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{classItem.name}</h3>
                  <p className="text-xs mb-2 text-muted-foreground uppercase tracking-wide">{classItem.focus}</p>
                  <p className="text-sm text-muted-foreground">{classItem.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onNext}
            disabled={!selected}
            className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border border-primary h-12 px-8 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            INITIATE_CORE_UPLOAD
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
