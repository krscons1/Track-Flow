import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { TeamMemberModel } from "@/lib/server-only/models/TeamMember"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    // Find the current user's team membership
    const myMembership = await db.collection("teamMembers").findOne({ userId: new ObjectId(user._id) })
    if (!myMembership) {
      return NextResponse.json({ members: [] }) // Not in any team
    }
    const workspaceId = myMembership.workspaceId.toString()
    const members = await TeamMemberModel.findByWorkspaceId(workspaceId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Get team members error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 