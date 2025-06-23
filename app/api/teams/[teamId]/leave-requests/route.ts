import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { LeaveRequestModel } from "@/lib/server-only/models/LeaveRequest"
import { TeamModel } from "@/lib/server-only/models/Team"
import { NotificationModel } from "@/lib/server-only/models/Notification"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: { teamId: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { reason } = await request.json()
    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: "Reason is required and must be at least 5 characters." }, { status: 400 })
    }
    const team = await TeamModel.findById(params.teamId)
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }
    // Create leave request
    const leaveRequest = await LeaveRequestModel.create({
      teamId: new ObjectId(params.teamId),
      userId: new ObjectId(user._id),
      reason,
    })
    // Notify team leader
    await NotificationModel.create({
      userId: team.createdBy,
      type: "leave_request",
      message: `${user.name} has requested to leave your team (${team.name}).`,
      data: { leaveRequestId: leaveRequest._id, userId: user._id, teamId: params.teamId, reason },
    })
    return NextResponse.json({ leaveRequest }, { status: 201 })
  } catch (error) {
    console.error("Leave request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 