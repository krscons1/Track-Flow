import { type NextRequest, NextResponse } from "next/server"
import { TaskModel } from "@/lib/server-only/models/Task"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tasks = await TaskModel.findForUser(user._id.toString())
    const sanitizedTasks = tasks.map((task) => ({
      ...task,
      _id: task._id?.toString(),
      project: task.project.toString(),
      assignee: task.assignee.toString(),
      createdBy: task.createdBy.toString(),
    }))
    return NextResponse.json({ tasks: sanitizedTasks })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { title, description, status, priority, project, assignee, dueDate, estimatedHours, tags } = data

    if (!title || !description || !project || !assignee || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const task = await TaskModel.create({
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      project: new ObjectId(project),
      assignee: new ObjectId(assignee),
      createdBy: new ObjectId(user._id),
      dueDate: new Date(dueDate),
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      tags: tags || [],
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
