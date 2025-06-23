import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { InvitationModel } from "@/lib/server-only/models/Invitation"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, userId, role, projectId } = await request.json()

    if (!email || !userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // For simplicity, we'll use a default workspaceId. In a multi-tenant app,
    // you'd get this from the user's session or the project.
    const workspaceId = new ObjectId("60f7e2c8a1d3b5a7a4f4b3e1") // Replace with a real workspace ID

    const invitation = await InvitationModel.create({
      email,
      userId: new ObjectId(userId),
      role,
      invitedBy: user._id,
      workspaceId,
      status: "pending",
    })

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error("Send invitation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real app, you'd likely filter invitations by workspace or project
    const invitations = await InvitationModel.findByWorkspaceId("60f7e2c8a1d3b5a7a4f4b3e1") // Replace with a real workspace ID

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Get invitations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
