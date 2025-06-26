import { type NextRequest, NextResponse } from "next/server"
import { SubtaskModel } from "@/lib/server-only/models/Subtask"
import { getCurrentUser } from "@/lib/server-only/auth"
import { TaskModel } from "@/lib/server-only/models/Task"
import { ActivityLogModel } from "@/lib/server-only/models/ActivityLog"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const db = await getDatabase()
    const prevSubtask = await db.collection("subtasks").findOne({ _id: new ObjectId(params.id) })
    const subtask = await SubtaskModel.updateById(params.id, data)

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 })
    }

    // Log activity if subtask is completed now and was not completed before
    if (data.completed === true && prevSubtask && !prevSubtask.completed) {
      const membership = await db.collection("teamMembers").findOne({ userId: user._id })
      if (membership) {
        await ActivityLogModel.create({
          teamId: membership.workspaceId,
          userId: user._id,
          userName: user.name,
          type: "subtask_completed",
          description: `Completed subtask \"${subtask.title}\"`,
          entityId: subtask._id,
          entityName: subtask.title,
        })
      }
    }

    const allSubtasks = await SubtaskModel.findByTaskId(subtask.taskId.toString())
    const allCompleted = allSubtasks.every((s) => s.completed)
    const parentTask = await TaskModel.findById(subtask.taskId.toString())

    if (parentTask) {
      if (allCompleted && parentTask.status !== "completed") {
        await TaskModel.updateById(subtask.taskId.toString(), { status: "completed" })
      } else if (!allCompleted && parentTask.status === "completed") {
        await TaskModel.updateById(subtask.taskId.toString(), { status: "in-progress" })
      }
    }

    const sanitizedSubtask = {
      ...subtask,
      _id: subtask._id?.toString(),
      taskId: subtask.taskId.toString(),
      assignee: subtask.assignee?.toString(),
    }

    return NextResponse.json({ subtask: sanitizedSubtask })
  } catch (error) {
    console.error("Update subtask error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 