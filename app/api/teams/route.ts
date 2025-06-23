import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { TeamModel } from "@/lib/server-only/models/Team"
import { TeamMemberModel } from "@/lib/server-only/models/TeamMember"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { name, projectId } = await request.json()
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 })
    }
    // Create the team
    const team = await TeamModel.create({ name, createdBy: new ObjectId(user._id), projectId: new ObjectId(projectId) })
    // Add the creator as the team leader
    const db = await getDatabase()
    await db.collection("teamMembers").insertOne({
      userId: new ObjectId(user._id),
      workspaceId: team._id,
      role: "team_leader",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 