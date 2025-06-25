import PomodoroTimer from '@/components/time-tracking/PomodoroTimer'
import { getCurrentUser } from '@/lib/server-only/auth'
import { redirect } from 'next/navigation'
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import React from 'react'
import ActivityFeed from '@/components/dashboard/activity-feed'

async function fetchPomodoroSessions(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/pomodoro-sessions?userId=${userId}&startDate=${today.toISOString()}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return await res.json()
}

function getStatsAndChartData(sessions: any[]) {
  // Stats
  const focusSessions = sessions.filter((s: any) => s.type === 'focus' && s.status === 'completed')
  const breakSessions = sessions.filter((s: any) => s.type === 'break')
  const completedToday = focusSessions.length
  const avgSessionLength = focusSessions.length
    ? Math.round(
        focusSessions.reduce((sum: number, s: any) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()), 0) /
          (focusSessions.length * 60000)
      )
    : 25
  const breakSkipped = breakSessions.filter((s: any) => s.status === 'skipped').length
  const focusBreakRatio = breakSessions.length
    ? Math.round((focusSessions.length / breakSessions.length) * 100)
    : 100

  // Line chart: Pomodoros by hour
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const lineChartData = hours.map((hour) => ({
    hour: `${hour}:00`,
    pomodoros: focusSessions.filter((s: any) => new Date(s.startTime).getHours() === hour).length,
  }))

  // Donut chart: Focus vs Break time (minutes)
  const focusMinutes = focusSessions.reduce((sum: number, s: any) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000, 0)
  const breakMinutes = breakSessions.reduce((sum: number, s: any) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000, 0)
  const donutChartData = [
    { name: 'Focus', value: Math.round(focusMinutes), color: '#3B82F6' },
    { name: 'Break', value: Math.round(breakMinutes), color: '#F59E0B' },
  ]

  return {
    stats: { completedToday, avgSessionLength, breakSkipped, focusBreakRatio },
    lineChartData,
    donutChartData,
  }
}

export default async function LiveAnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  const sessions = await fetchPomodoroSessions(user._id)
  const { stats, lineChartData, donutChartData } = getStatsAndChartData(sessions)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Live Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pomodoro Timer and Session Overview */}
        <div className="space-y-4">
          <PomodoroTimer userId={user._id} />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded shadow">
              <div className="text-sm text-gray-500">Pomodoros Completed Today</div>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
            </div>
            <div className="bg-green-50 p-4 rounded shadow">
              <div className="text-sm text-gray-500">Avg. Focus Session (min)</div>
              <div className="text-2xl font-bold">{stats.avgSessionLength}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded shadow">
              <div className="text-sm text-gray-500">Breaks Skipped</div>
              <div className="text-2xl font-bold">{stats.breakSkipped}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded shadow">
              <div className="text-sm text-gray-500">Focus/Break Ratio</div>
              <div className="text-2xl font-bold">{stats.focusBreakRatio}%</div>
            </div>
          </div>
        </div>
        {/* Productivity Charts & Team Feed */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow min-h-[200px] flex flex-col items-center justify-center">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="pomodoros" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <ChartTooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-500 mt-2">Pomodoros by Time of Day</div>
          </div>
          <div className="bg-white p-4 rounded shadow min-h-[120px] flex flex-col items-center justify-center">
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <ChartLegend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-500 mt-2">Focus vs Break Time</div>
          </div>
          <div className="bg-white p-4 rounded shadow min-h-[120px] flex items-center justify-center">
            {/* TODO: Heatmap Calendar (Productivity by hour) */}
            <span className="text-gray-400">[Heatmap Calendar Placeholder]</span>
          </div>
          <div className="bg-white p-4 rounded shadow min-h-[120px] flex items-center justify-center">
            {/* Team Activity Feed (Pomodoro + project/task events) */}
            <div className="w-full">
              <ActivityFeed user={user} pomodoroSessions={sessions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 