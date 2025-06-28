import { type NextRequest, NextResponse } from "next/server"
import { TimeLogModel } from "@/lib/server-only/models/TimeLog"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ObjectId } from "mongodb"
import { ActivityLogModel } from "@/lib/server-only/models/ActivityLog"

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
    const { hours, date, description, subtaskId, subtaskTitle, pomodoroSessions, breakMinutes, breaksSkipped } = data

    if (!hours || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const timeLog = await TimeLogModel.create({
      hours: Number(hours),
      date: new Date(date),
      taskId: new ObjectId(params.id),
      userId: new ObjectId(user._id),
      description: description || "",
      subtaskId: subtaskId ? new ObjectId(subtaskId) : undefined,
      subtaskTitle: subtaskTitle || undefined,
      pomodoroSessions: pomodoroSessions || undefined,
      breakMinutes: breakMinutes || undefined,
      breaksSkipped: breaksSkipped || undefined,
    })

    const sanitizedTimeLog = {
      ...timeLog,
      _id: timeLog._id?.toString(),
      taskId: timeLog.taskId.toString(),
      userId: timeLog.userId.toString(),
      subtaskId: timeLog.subtaskId?.toString(),
    }

    // Log activity for time log creation
    const db = await import("@/lib/server-only/mongodb").then(m => m.getDatabase())
    const membership = await db.collection("teamMembers").findOne({ userId: new ObjectId(user._id) })
    let entityName = undefined;
    if (subtaskTitle) {
      entityName = subtaskTitle;
    } else {
      // Fetch the task title
      const task = await db.collection("tasks").findOne({ _id: new ObjectId(params.id) });
      entityName = task?.title;
    }
    if (membership) {
      await ActivityLogModel.create({
        teamId: membership.workspaceId,
        userId: new ObjectId(user._id),
        userName: user.name,
        type: "timelog_created",
        description: `Logged ${hours}h on ${date}${subtaskTitle ? ` for subtask '${subtaskTitle}'` : ''}`,
        entityId: timeLog._id,
        entityName,
      })
    }

    return NextResponse.json({ timeLog: sanitizedTimeLog }, { status: 201 })
  } catch (error) {
    console.error("Create time log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timeLogs = await TimeLogModel.find({
      taskId: new ObjectId(params.id),
      userId: new ObjectId(user._id),
    })

    const sanitizedTimeLogs = timeLogs.map((log) => ({
      ...log,
      _id: log._id?.toString(),
      taskId: log.taskId.toString(),
      userId: log.userId.toString(),
    }))

    return NextResponse.json({ timeLogs: sanitizedTimeLogs })
  } catch (error) {
    console.error("Get time logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { logId } = await request.json()
    if (!logId) {
      return NextResponse.json({ error: "Missing logId" }, { status: 400 })
    }
    const deleted = await TimeLogModel.deleteById(logId, user._id)
    if (deleted) {
      return NextResponse.json({ message: "Time log deleted" }, { status: 200 })
    } else {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete time log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 