import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { LeaveRequestModel } from "@/lib/server-only/models/LeaveRequest"
import { TeamModel } from "@/lib/server-only/models/Team"
import { NotificationModel } from "@/lib/server-only/models/Notification"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: { requestId: string }
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
    const leaveRequest = await db.collection("leaveRequests").findOne({ _id: new ObjectId(params.requestId) })
    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }
    const team = await TeamModel.findById(leaveRequest.teamId.toString())
    if (!team || team.createdBy.toString() !== user._id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    // Update leave request status
    await LeaveRequestModel.updateById(params.requestId, { status })
    if (status === "accepted") {
      // Remove user from teamMembers
      await db.collection("teamMembers").deleteOne({ userId: leaveRequest.userId, workspaceId: leaveRequest.teamId })
    }
    // Notify the user
    await NotificationModel.create({
      userId: leaveRequest.userId,
      type: "leave_request_response",
      message: status === "accepted"
        ? `Your request to leave the team (${team.name}) was accepted.`
        : `Your request to leave the team (${team.name}) was declined.`,
      data: { teamId: team._id, status },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leave request response error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 