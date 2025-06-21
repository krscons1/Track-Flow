import { type NextRequest, NextResponse } from "next/server"
import { TeamInvitationModel } from "@/lib/server-only/models/Team"
import { emailService } from "@/lib/email/email-service"
import { getServerSession } from "@/lib/server-only/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, userId, email, role } = await request.json()

    // Generate invitation token
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const invitation = await TeamInvitationModel.create({
      projectId,
      invitedBy: session.userId,
      invitedUser: userId,
      email,
      role,
      status: "pending",
      token,
      expiresAt,
    })

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    const emailTemplate = emailService.generateInvitationEmail(
      session.user?.name || "Team Member",
      "Project Name", // TODO: Get actual project name
      inviteLink,
    )

    const emailSent = await emailService.sendEmail(email, emailTemplate)

    if (!emailSent) {
      console.warn("Failed to send invitation email")
    }

    return NextResponse.json({ success: true, invitation })
  } catch (error) {
    console.error("Invitation creation error:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}
