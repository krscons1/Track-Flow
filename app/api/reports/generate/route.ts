import { type NextRequest, NextResponse } from "next/server"
import { PDFGenerator } from "@/lib/reports/pdf-generator"
import { getServerSession } from "@/lib/server-only/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, dateRange, projectId, data } = await request.json()

    // Generate report data based on type
    const reportData = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      dateRange: dateRange.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
      user: {
        name: session.user?.name || "Unknown User",
        email: session.user?.email || "unknown@example.com",
      },
      projects: [
        {
          name: "TrackFlow Web",
          totalHours: 45.2,
          tasksCompleted: 12,
          tasks: [
            { title: "Homepage Design", status: "completed", hours: 8.5, completedAt: new Date().toISOString() },
            { title: "User Authentication", status: "completed", hours: 12.3, completedAt: new Date().toISOString() },
            { title: "Dashboard Layout", status: "in_progress", hours: 6.2 },
          ],
        },
        {
          name: "Mobile App",
          totalHours: 38.7,
          tasksCompleted: 8,
          tasks: [
            { title: "Login Screen", status: "completed", hours: 5.5, completedAt: new Date().toISOString() },
            { title: "Navigation Setup", status: "completed", hours: 7.2, completedAt: new Date().toISOString() },
          ],
        },
      ],
      summary: {
        totalHours: data?.summary?.totalHours || 156.5,
        totalTasks: 25,
        completedTasks: 20,
        productivity: data?.summary?.productivity || 91,
      },
    }

    const pdfBuffer = await PDFGenerator.generateTimeReport(reportData)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
