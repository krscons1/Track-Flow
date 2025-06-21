import { type NextRequest, NextResponse } from "next/server"
import { SubtaskModel } from "@/lib/server-only/models/Subtask"
import { getCurrentUser } from "@/lib/server-only/auth"
import { TaskModel } from "@/lib/server-only/models/Task"

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
    const subtask = await SubtaskModel.updateById(params.id, data)

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 })
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