import { type NextRequest, NextResponse } from "next/server"
import { ProjectModel } from "@/lib/server-only/models/Project"
import { getCurrentUser } from "@/lib/server-only/auth"

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

    const project = await ProjectModel.findById(params.id)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const sanitizedProject = {
      ...project,
      _id: project._id?.toString(),
      owner: project.owner.toString(),
      members: project.members.map((id) => id.toString()),
    }

    return NextResponse.json({ project: sanitizedProject })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const project = await ProjectModel.updateById(params.id, data)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const sanitizedProject = {
      ...project,
      _id: project._id?.toString(),
      owner: project.owner.toString(),
      members: project.members.map((id) => id.toString()),
    }

    return NextResponse.json({ project: sanitizedProject })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await ProjectModel.deleteById(params.id)

    if (!success) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
