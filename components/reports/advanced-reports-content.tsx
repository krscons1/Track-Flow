"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useToast } from "@/hooks/use-toast"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface AdvancedReportsContentProps {
  user: User
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16"]

export default function AdvancedReportsContent({ user }: AdvancedReportsContentProps) {
  const [reportType, setReportType] = useState("time")
  const [dateRange, setDateRange] = useState("last_30_days")
  const [selectedProject, setSelectedProject] = useState("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadReportData()
  }, [reportType, dateRange, selectedProject])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      // Mock comprehensive report data
      const mockData = {
        time: {
          summary: {
            totalHours: 156.5,
            billableHours: 142.3,
            averageDaily: 7.8,
            productivity: 91,
          },
          dailyHours: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            hours: Math.random() * 10 + 2,
            billable: Math.random() * 8 + 1,
          })),
          projectBreakdown: [
            { name: "TrackFlow Web", hours: 45.2, percentage: 29 },
            { name: "Mobile App", hours: 38.7, percentage: 25 },
            { name: "API Development", hours: 32.1, percentage: 21 },
            { name: "Bug Fixes", hours: 25.8, percentage: 16 },
            { name: "Documentation", hours: 14.7, percentage: 9 },
          ],
          teamComparison: [
            { name: "John Doe", hours: 156.5, efficiency: 91 },
            { name: "Jane Smith", hours: 142.3, efficiency: 88 },
            { name: "Mike Johnson", hours: 134.7, efficiency: 85 },
            { name: "Sarah Wilson", hours: 128.9, efficiency: 92 },
          ],
        },
        productivity: {
          summary: {
            tasksCompleted: 47,
            averageCompletionTime: 2.3,
            onTimeDelivery: 89,
            qualityScore: 94,
          },
          weeklyTrends: Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            completed: Math.floor(Math.random() * 15) + 5,
            efficiency: Math.floor(Math.random() * 20) + 80,
            quality: Math.floor(Math.random() * 15) + 85,
          })),
          tasksByStatus: [
            { name: "Completed", value: 47, color: "#10B981" },
            { name: "In Progress", value: 12, color: "#3B82F6" },
            { name: "Pending", value: 8, color: "#F59E0B" },
            { name: "Blocked", value: 3, color: "#EF4444" },
          ],
          priorityDistribution: [
            { priority: "High", count: 15, completed: 12 },
            { priority: "Medium", count: 32, completed: 28 },
            { priority: "Low", count: 23, completed: 20 },
          ],
        },
        team: {
          summary: {
            totalMembers: 8,
            activeMembers: 6,
            averageHours: 35.2,
            teamEfficiency: 88,
          },
          memberPerformance: [
            { name: "John Doe", tasks: 15, hours: 45.2, efficiency: 91 },
            { name: "Jane Smith", tasks: 12, hours: 38.7, efficiency: 88 },
            { name: "Mike Johnson", tasks: 14, hours: 42.1, efficiency: 85 },
            { name: "Sarah Wilson", tasks: 11, hours: 35.8, efficiency: 92 },
          ],
          collaborationMetrics: [
            { metric: "Code Reviews", value: 23, trend: "+15%" },
            { metric: "Comments", value: 156, trend: "+8%" },
            { metric: "Meetings", value: 12, trend: "-5%" },
            { metric: "Shared Tasks", value: 34, trend: "+22%" },
          ],
        },
      }

      setReportData(mockData[reportType as keyof typeof mockData])
    } catch (error) {
      console.error("Failed to load report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDFReport = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: reportType,
          dateRange,
          projectId: selectedProject !== "all" ? selectedProject : null,
          data: reportData,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Report generated and downloaded successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToCSV = () => {
    // Implementation for CSV export
    toast({
      title: "Success",
      description: "Data exported to CSV successfully",
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Reports 📊
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Comprehensive analytics and detailed insights</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportToCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={generatePDFReport}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isGenerating ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Filters:</span>
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time Tracking</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="team">Team Performance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="1">TrackFlow Web</SelectItem>
                <SelectItem value="2">Mobile App</SelectItem>
                <SelectItem value="3">API Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in">
        {reportType === "time" && (
          <>
            <Card className="hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Total Hours</p>
                    <p className="text-3xl font-bold">{reportData.summary.totalHours}h</p>
                  </div>
                  <Clock className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Billable Hours</p>
                    <p className="text-3xl font-bold">{reportData.summary.billableHours}h</p>
                  </div>
                  <Target className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Daily Average</p>
                    <p className="text-3xl font-bold">{reportData.summary.averageDaily}h</p>
                  </div>
                  <Calendar className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Productivity</p>
                    <p className="text-3xl font-bold">{reportData.summary.productivity}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "productivity" && (
          <>
            <Card className="hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Tasks Completed</p>
                    <p className="text-3xl font-bold">{reportData.summary.tasksCompleted}</p>
                  </div>
                  <Target className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Avg Completion</p>
                    <p className="text-3xl font-bold">{reportData.summary.averageCompletionTime}d</p>
                  </div>
                  <Clock className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">On-Time Delivery</p>
                    <p className="text-3xl font-bold">{reportData.summary.onTimeDelivery}%</p>
                  </div>
                  <Calendar className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Quality Score</p>
                    <p className="text-3xl font-bold">{reportData.summary.qualityScore}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "team" && (
          <>
            <Card className="hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Total Members</p>
                    <p className="text-3xl font-bold">{reportData.summary.totalMembers}</p>
                  </div>
                  <Users className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Active Members</p>
                    <p className="text-3xl font-bold">{reportData.summary.activeMembers}</p>
                  </div>
                  <Target className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Avg Hours/Week</p>
                    <p className="text-3xl font-bold">{reportData.summary.averageHours}h</p>
                  </div>
                  <Clock className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Team Efficiency</p>
                    <p className="text-3xl font-bold">{reportData.summary.teamEfficiency}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {reportType === "time" && (
          <>
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Daily Hours Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.dailyHours}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="hours" stroke="#3B82F6" fill="url(#colorHours)" name="Total Hours" />
                    <Area
                      type="monotone"
                      dataKey="billable"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                      name="Billable Hours"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Project Time Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={reportData.projectBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {reportData.projectBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "productivity" && (
          <>
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Weekly Productivity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} name="Tasks Completed" />
                    <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={3} name="Efficiency %" />
                    <Line type="monotone" dataKey="quality" stroke="#F59E0B" strokeWidth={3} name="Quality Score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Task Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={reportData.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.tasksByStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "team" && (
          <>
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Member Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.memberPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks" fill="#3B82F6" name="Tasks Completed" />
                    <Bar dataKey="hours" fill="#10B981" name="Hours Worked" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Collaboration Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.collaborationMetrics.map((metric: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{metric.metric}</p>
                        <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                      </div>
                      <Badge
                        className={
                          metric.trend.startsWith("+") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {metric.trend}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
