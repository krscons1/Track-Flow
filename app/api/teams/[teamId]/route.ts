import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { TeamModel } from "@/lib/server-only/models/Team"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: { teamId: string }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const db = await getDatabase()
    const team = await TeamModel.findById(params.teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    if (team.createdBy.toString() !== user._id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    // Remove team members
    await db.collection("teamMembers").deleteMany({ workspaceId: new ObjectId(params.teamId) })
    // Remove leave requests
    await db.collection("leaveRequests").deleteMany({ teamId: new ObjectId(params.teamId) })
    // Remove join requests
    await db.collection("joinRequests").deleteMany({ teamId: new ObjectId(params.teamId) })
    // Remove the team
    await db.collection("teams").deleteOne({ _id: new ObjectId(params.teamId) })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 