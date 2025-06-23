import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import { TeamModel } from "@/lib/server-only/models/Team"
import { ProjectModel } from "@/lib/server-only/models/Project"
import { getDatabase } from "@/lib/server-only/mongodb"
import TeamDetailsClient from "@/components/teams/TeamDetailsClient"

interface TeamDetailsPageProps {
  params: { teamId: string }
}

export default async function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  // Fetch team, project, and members
  const team = await TeamModel.findById(params.teamId)
  if (!team) redirect("/team")
  const project = team.projectId ? await ProjectModel.findById(team.projectId.toString()) : null
  const db = await getDatabase()
  // Join user info for each member
  const members = await db.collection("teamMembers").aggregate([
    { $match: { workspaceId: team._id } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 1,
        userId: 1,
        role: 1,
        status: 1,
        userName: "$userInfo.name",
        userAvatar: "$userInfo.avatar",
        userEmail: "$userInfo.email",
        lastActive: "$userInfo.lastActive",
        tasksCompleted: { $literal: 0 },
        hoursWorked: { $literal: 0 },
      },
    },
  ]).toArray()

  const myMembership = members.find((m) => m.userId?.toString() === user._id)
  const isLeader = myMembership?.role === "team_leader"

  let leaveRequests = []
  if (isLeader) {
    // Only fetch leave requests if user is team leader
    const { LeaveRequestModel } = await import("@/lib/server-only/models/LeaveRequest")
    leaveRequests = await LeaveRequestModel.findByTeamId(params.teamId)
  }

  return <TeamDetailsClient team={team} project={project} members={members} isLeader={isLeader} leaveRequests={leaveRequests} />
} 