import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { getDatabase } from "@/lib/server-only/mongodb"
import { TeamModel } from "@/lib/server-only/models/Team"
import { ProjectModel } from "@/lib/server-only/models/Project"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const db = await getDatabase()
    // Find all team memberships for the user
    const memberships = await db.collection("teamMembers").find({ userId: new ObjectId(user._id) }).toArray()
    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await TeamModel.findById(membership.workspaceId.toString())
        let projectTitle = undefined
        let memberCount = 0
        if (team && team.projectId) {
          const project = await ProjectModel.findById(team.projectId.toString())
          projectTitle = project?.title
        }
        if (team) {
          memberCount = await db.collection("teamMembers").countDocuments({ workspaceId: team._id })
        }
        return {
          _id: team?._id,
          name: team?.name,
          projectId: team?.projectId,
          projectTitle,
          role: membership.role,
          memberCount,
          lastUpdated: team?.updatedAt,
        }
      })
    )
    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Get my teams error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 