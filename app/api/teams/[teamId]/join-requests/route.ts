import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { JoinRequestModel } from "@/lib/server-only/models/JoinRequest"
import { TeamModel } from "@/lib/server-only/models/Team"
import { NotificationModel } from "@/lib/server-only/models/Notification"
import { ObjectId } from "mongodb"

interface RouteParams {
  params: {
    teamId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { teamId } = params
    // Prevent duplicate requests
    const existing = await JoinRequestModel.findByUserId(user._id)
    if (existing.some((req) => req.teamId.toString() === teamId && req.status === "pending")) {
      return NextResponse.json({ error: "You have already requested to join this team." }, { status: 400 })
    }
    const joinRequest = await JoinRequestModel.create({
      teamId: new ObjectId(teamId),
      userId: new ObjectId(user._id),
    })
    // Notify team leader
    const team = await TeamModel.findById(teamId)
    if (team) {
      await NotificationModel.create({
        userId: team.createdBy,
        type: "join_request",
        message: `${user.name} has requested to join your team (${team.name}).`,
        data: { joinRequestId: joinRequest._id, userId: user._id, teamId },
      })
    }
    return NextResponse.json({ joinRequest }, { status: 201 })
  } catch (error) {
    console.error("Join request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { teamId } = params
    // Only team leader can view join requests
    const team = await TeamModel.findById(teamId)
    if (!team || team.createdBy.toString() !== user._id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const joinRequests = await JoinRequestModel.findByTeamId(teamId)
    return NextResponse.json({ joinRequests })
  } catch (error) {
    console.error("Get join requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 