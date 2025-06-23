import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { JoinRequestModel } from "@/lib/server-only/models/JoinRequest"
import { TeamModel } from "@/lib/server-only/models/Team"
import { ProjectModel } from "@/lib/server-only/models/Project"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const joinRequests = await JoinRequestModel.findByUserId(user._id)
    // Fetch team names and project titles for each join request
    const teams = await Promise.all(
      joinRequests.map(async (req) => {
        const team = await TeamModel.findById(req.teamId.toString())
        let projectTitle = undefined
        if (team && team.projectId) {
          const project = await ProjectModel.findById(team.projectId.toString())
          projectTitle = project?.title
        }
        return {
          ...req,
          teamName: team?.name,
          projectTitle,
        }
      })
    )
    return NextResponse.json({ joinRequests: teams })
  } catch (error) {
    console.error("Get my join requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 