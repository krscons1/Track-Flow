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
  const membersRaw = await db.collection("teamMembers").aggregate([
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
        lastLogin: "$userInfo.lastLogin",
        lastLogout: "$userInfo.lastLogout",
      },
    },
  ]).toArray()

  // Aggregate tasks completed and hours worked for each member
  const projectId = team.projectId?.toString()
  let tasks: any[] = []
  let timeLogs: any[] = []
  let subtasks: any[] = []
  if (projectId) {
    tasks = await db.collection("tasks").find({ project: team.projectId }).toArray()
    const taskIds = tasks.map((t: any) => t._id)
    timeLogs = await db.collection("timelogs").find({ taskId: { $in: taskIds } }).toArray()
    subtasks = await db.collection("subtasks").find({ taskId: { $in: taskIds } }).toArray()
  }

  const members = membersRaw.map((member: any) => {
    // All time logs for this member
    const memberLogs = timeLogs.filter((log: any) => log.userId?.toString() === member.userId?.toString())
    // Find the latest activity date from time logs
    const latestLog = memberLogs.reduce((latest: any, log: any) => {
      if (!latest || (log.date && new Date(log.date) > new Date(latest.date))) return log
      return latest
    }, null)
    const lastActive = latestLog && latestLog.date ? latestLog.date : member.lastActive
    // Completed subtasks: member has a time log for the subtask and subtask is completed
    const completedSubtasks = memberLogs.filter((log: any) => {
      if (!log.subtaskId) return false
      const subtask = subtasks.find((s: any) => s._id?.toString() === log.subtaskId?.toString())
      return subtask && subtask.completed
    })
    // Completed tasks: member has a time log for the task or any of its subtasks, and the task is completed
    const completedTasksSet = new Set<string>()
    memberLogs.forEach((log: any) => {
      // Direct task log
      if (log.taskId) {
        const task = tasks.find((t: any) => t._id?.toString() === log.taskId?.toString())
        if (task && task.status === 'completed') {
          completedTasksSet.add(task._id.toString())
        }
      }
      // Subtask log
      if (log.subtaskId) {
        const subtask = subtasks.find((s: any) => s._id?.toString() === log.subtaskId?.toString())
        if (subtask) {
          const task = tasks.find((t: any) => t._id?.toString() === subtask.taskId?.toString())
          if (task && task.status === 'completed') {
            completedTasksSet.add(task._id.toString())
          }
        }
      }
    })
    const hoursWorked = memberLogs.reduce((sum: number, log: any) => sum + (log.hours || 0), 0)
    // Member work table: all time logs for this member, with task/subtask info
    const memberWork = memberLogs.map((log: any) => {
      const task = tasks.find((t: any) => t._id?.toString() === log.taskId?.toString())
      const subtask = log.subtaskId ? subtasks.find((s: any) => s._id?.toString() === log.subtaskId?.toString()) : null
      return {
        type: subtask ? 'Subtask' : 'Task',
        title: subtask ? subtask.title : (task ? task.title : ''),
        hours: log.hours,
        description: log.description,
        date: log.date,
        taskId: log.taskId,
        subtaskId: log.subtaskId,
      }
    })
    return {
      ...member,
      lastActive,
      lastLogin: member.lastLogin,
      lastLogout: member.lastLogout,
      tasksCompleted: completedTasksSet.size,
      hoursWorked: hoursWorked,
      subtasksCompleted: completedSubtasks.length,
      memberWork,
    }
  })

  // Team analytics
  const totalTasks = tasks.length
  const totalCompletedTasks = tasks.filter((t: any) => t.status === "completed").length
  const totalHours = timeLogs.reduce((sum: number, log: any) => sum + (log.hours || 0), 0)
  const avgHoursPerMember = members.length > 0 ? totalHours / members.length : 0
  const topPerformer = members.reduce((top, m) => (m.hoursWorked > (top?.hoursWorked || 0) ? m : top), null)
  const analytics = {
    totalTasks,
    totalCompletedTasks,
    totalHours,
    avgHoursPerMember,
    topPerformer: topPerformer ? { name: topPerformer.userName, hours: topPerformer.hoursWorked } : null,
  }

  const myMembership = members.find((m) => m.userId?.toString() === user._id)
  const isLeader = myMembership?.role === "team_leader"

  let leaveRequests: any[] = []
  if (isLeader) {
    // Only fetch leave requests if user is team leader
    const { LeaveRequestModel } = await import("@/lib/server-only/models/LeaveRequest")
    leaveRequests = await LeaveRequestModel.findByTeamId(params.teamId)
  }

  return <TeamDetailsClient team={team} project={project} members={members} isLeader={isLeader} leaveRequests={leaveRequests} analytics={analytics} subtasks={subtasks} user={user} />
} 