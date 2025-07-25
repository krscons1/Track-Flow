import { type NextRequest, NextResponse } from "next/server"
import { SubtaskModel } from "@/lib/server-only/models/Subtask"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ObjectId } from "mongodb"
import { TaskModel } from "@/lib/server-only/models/Task"
import { ActivityLogModel } from "@/lib/server-only/models/ActivityLog"
import { getDatabase } from "@/lib/server-only/mongodb"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subtasks = await SubtaskModel.findByTaskId(params.id)
    const sanitizedSubtasks = subtasks.map((subtask) => ({
      ...subtask,
      _id: subtask._id?.toString(),
      taskId: subtask.taskId.toString(),
      assignee: subtask.assignee?.toString(),
    }))

    return NextResponse.json({ subtasks: sanitizedSubtasks })
  } catch (error) {
    console.error("Get subtasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { title, description } = data

    if (!title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const subtask = await SubtaskModel.create({
      title,
      description,
      completed: false,
      taskId: new ObjectId(params.id),
      assignee: new ObjectId(user._id),
    })

    // Log activity: find user's first team
    const db = await getDatabase()
    const membership = await db.collection("teamMembers").findOne({ userId: new ObjectId(user._id) })
    if (membership) {
      await ActivityLogModel.create({
        teamId: membership.workspaceId,
        userId: new ObjectId(user._id),
        userName: user.name,
        type: "subtask_created",
        description: `Created subtask \"${subtask.title}\" for task \"${params.id}\"`,
        entityId: subtask._id,
        entityName: subtask.title,
      })
    }

    const parentTask = await TaskModel.findById(params.id)
    if (parentTask && parentTask.status === "completed") {
      await TaskModel.updateById(params.id, { status: "in-progress" })
    }

    const sanitizedSubtask = {
      ...subtask,
      _id: subtask._id?.toString(),
      taskId: subtask.taskId.toString(),
      assignee: subtask.assignee?.toString(),
    }

    return NextResponse.json({ subtask: sanitizedSubtask }, { status: 201 })
  } catch (error) {
    console.error("Create subtask error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Forward to /api/subtasks/[id]/route.ts PATCH logic for consistency
  // This is a thin wrapper for RESTful subtask update from the task context
  const subtaskId = params.id
  const subtaskApiUrl = `/api/subtasks/${subtaskId}`
  const body = await request.text()
  const res = await fetch(subtaskApiUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
} 