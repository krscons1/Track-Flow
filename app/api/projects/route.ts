import { type NextRequest, NextResponse } from "next/server"
import { ProjectModel } from "@/lib/server-only/models/Project"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await ProjectModel.findForUser(user._id.toString())
    const sanitizedProjects = projects.map((project) => ({
      ...project,
      _id: project._id?.toString(),
      owner: project.owner.toString(),
      members: project.members.map((id) => id.toString()),
    }))
    return NextResponse.json({ projects: sanitizedProjects })
  } catch (error) {
    console.error("Get projects error:", error)
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
    const { title, description, status, priority, startDate, dueDate, members, color, tags } = data

    if (!title || !description || !startDate || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const project = await ProjectModel.create({
      title,
      description,
      status: status || "not-started",
      priority: priority || "medium",
      progress: 0,
      startDate: new Date(startDate),
      dueDate: new Date(dueDate),
      owner: new ObjectId(user._id),
      members: members?.map((id: string) => new ObjectId(id)) || [new ObjectId(user._id)],
      color: color || "#3B82F6",
      tags: tags || [],
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
