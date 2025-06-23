import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export interface TeamMember {
  _id?: ObjectId
  userId: ObjectId
  workspaceId: ObjectId
  role: "team_leader" | "member"
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

export const TeamMemberModel = {
  async create(member: Omit<TeamMember, "_id" | "createdAt" | "updatedAt">): Promise<TeamMember> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<Omit<TeamMember, "_id">>("teamMembers").insertOne({
      ...member,
      createdAt: now,
      updatedAt: now,
    })
    return { ...member, _id: result.insertedId, createdAt: now, updatedAt: now }
  },

  async findByWorkspaceId(workspaceId: string): Promise<any[]> {
    const db = await getDatabase()
    return db
      .collection("teamMembers")
      .aggregate([
        { $match: { workspaceId: new ObjectId(workspaceId) } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user_info",
          },
        },
        { $unwind: "$user_info" },
        {
          $project: {
            _id: "$user_info._id", // Return the user's ID as the main ID
            name: "$user_info.name",
            email: "$user_info.email",
            avatar: "$user_info.avatar",
            teamRole: "$role",
            status: "$status",
            lastActive: { $literal: new Date().toISOString() },
            tasksCompleted: { $literal: 0 },
            hoursWorked: { $literal: 0 },
          },
        },
      ])
      .toArray()
  },
} 