import React, { useState, useRef, useEffect } from "react"

const FOCUS_DURATION = 25 * 60 // 25 minutes
const BREAK_DURATION = 5 * 60 // 5 minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function PomodoroTimer({ userId, projectId, taskId }: { userId: string, projectId?: string, taskId?: string }) {
  const [mode, setMode] = useState<"focus" | "break">("focus")
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isRunning) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout)
          handleSessionEnd()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current as NodeJS.Timeout)
    // eslint-disable-next-line
  }, [isRunning])

  const startTimer = () => setIsRunning(true)
  const pauseTimer = () => setIsRunning(false)
  const resetTimer = () => {
    setIsRunning(false)
    setSecondsLeft(mode === "focus" ? FOCUS_DURATION : BREAK_DURATION)
  }
  const skipSession = () => {
    setIsRunning(false)
    postSession("skipped")
    setMode(mode === "focus" ? "break" : "focus")
    setSecondsLeft(mode === "focus" ? BREAK_DURATION : FOCUS_DURATION)
  }
  const handleSessionEnd = () => {
    setIsRunning(false)
    postSession("completed")
    if (mode === "focus") setSessionCount((c) => c + 1)
    setMode(mode === "focus" ? "break" : "focus")
    setSecondsLeft(mode === "focus" ? BREAK_DURATION : FOCUS_DURATION)
  }
  const postSession = async (status: "completed" | "skipped") => {
    await fetch("/api/pomodoro-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        startTime: new Date(Date.now() - (mode === "focus" ? FOCUS_DURATION : BREAK_DURATION) * 1000),
        endTime: new Date(),
        type: mode,
        status,
        projectId,
        taskId,
      }),
    })
  }
  // Progress ring (SVG)
  const total = mode === "focus" ? FOCUS_DURATION : BREAK_DURATION
  const percent = 100 - (secondsLeft / total) * 100
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow w-full max-w-xs">
      <div className="text-lg font-semibold text-gray-700">{mode === "focus" ? "Focus" : "Break"} Session</div>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute top-0 left-0" width="128" height="128">
          <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
          <circle
            cx="64" cy="64" r="56"
            stroke="#3b82f6"
            strokeWidth="12"
            fill="none"
            strokeDasharray={2 * Math.PI * 56}
            strokeDashoffset={2 * Math.PI * 56 * (1 - percent / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s" }}
          />
        </svg>
        <span className="text-3xl font-mono z-10">{formatTime(secondsLeft)}</span>
      </div>
      <div className="flex gap-2">
        {!isRunning ? (
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={startTimer}>Start</button>
        ) : (
          <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={pauseTimer}>Pause</button>
        )}
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={resetTimer}>Reset</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={skipSession}>Skip</button>
      </div>
      <div className="text-sm text-gray-500">Pomodoros completed: <span className="font-bold">{sessionCount}</span></div>
    </div>
  )
} 