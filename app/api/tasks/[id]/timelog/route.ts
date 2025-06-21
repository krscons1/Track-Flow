import { type NextRequest, NextResponse } from "next/server"
import { TimeLogModel } from "@/lib/server-only/models/TimeLog"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { hours, date } = data

    if (!hours || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const timeLog = await TimeLogModel.create({
      hours: Number(hours),
      date: new Date(date),
      taskId: new ObjectId(params.id),
      userId: new ObjectId(user._id),
    })

    const sanitizedTimeLog = {
      ...timeLog,
      _id: timeLog._id?.toString(),
      taskId: timeLog.taskId.toString(),
      userId: timeLog.userId.toString(),
    }

    return NextResponse.json({ timeLog: sanitizedTimeLog }, { status: 201 })
  } catch (error) {
    console.error("Create time log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 