import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { JoinRequestModel } from "@/lib/server-only/models/JoinRequest"
import { TeamModel } from "@/lib/server-only/models/Team"
import { TeamMemberModel } from "@/lib/server-only/models/TeamMember"
import { NotificationModel } from "@/lib/server-only/models/Notification"
import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

interface RouteParams {
  params: {
    requestId: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { status } = await request.json()
    if (!["accepted", "declined"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    const db = await getDatabase()
    const joinRequest = await db.collection("joinRequests").findOne({ _id: new ObjectId(params.requestId) })
    if (!joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }
    // Only team leader can accept/decline
    const team = await TeamModel.findById(joinRequest.teamId.toString())
    if (!team || team.createdBy.toString() !== user._id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    // Update join request status
    await JoinRequestModel.updateById(params.requestId, { status })
    if (status === "accepted") {
      // Add user to teamMembers
      await db.collection("teamMembers").insertOne({
        userId: joinRequest.userId,
        workspaceId: joinRequest.teamId,
        role: "member",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      // Also add user to the project's members array if not already present
      if (team.projectId) {
        await db.collection("projects").updateOne(
          { _id: team.projectId },
          { $addToSet: { members: joinRequest.userId } }
        )
      }
    }
    // Notify the user who made the request
    await NotificationModel.create({
      userId: joinRequest.userId,
      type: "join_request_response",
      message: status === "accepted"
        ? `Your request to join the team (${team.name}) was accepted!`
        : `Your request to join the team (${team.name}) was declined.`,
      data: { teamId: team._id, status },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Join request response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 