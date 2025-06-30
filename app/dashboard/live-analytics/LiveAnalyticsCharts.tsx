"use client"

import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartTooltip, ChartLegend } from '@/components/ui/chart'

export default function LiveAnalyticsCharts({ lineChartData, donutChartData }: { lineChartData: any[], donutChartData: any[] }) {
  return (
    <>
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
    </>
  )
} 