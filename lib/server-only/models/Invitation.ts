import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export interface Invitation {
  _id?: ObjectId
  workspaceId: ObjectId // Or projectId if you have project-specific teams
  invitedBy: ObjectId
  userId: ObjectId // The user being invited
  email: string
  role: "admin" | "member"
  status: "pending" | "accepted" | "declined"
  createdAt: Date
  updatedAt: Date
}

export const InvitationModel = {
  async create(invitation: Omit<Invitation, "_id" | "createdAt" | "updatedAt">): Promise<Invitation> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<Omit<Invitation, "_id">>("invitations").insertOne({
      ...invitation,
      createdAt: now,
      updatedAt: now,
    })
    return { ...invitation, _id: result.insertedId, createdAt: now, updatedAt: now }
  },

  async findByUserId(userId: string): Promise<Invitation[]> {
    const db = await getDatabase()
    return db
      .collection<Invitation>("invitations")
      .find({ userId: new ObjectId(userId), status: "pending" })
      .toArray()
  },

  async findByWorkspaceId(workspaceId: string): Promise<Invitation[]> {
    const db = await getDatabase()
    return db.collection<Invitation>("invitations").find({ workspaceId: new ObjectId(workspaceId) }).toArray()
  },

  async updateById(id: string, updates: Partial<Invitation>): Promise<Invitation | null> {
    const db = await getDatabase()
    const result = await db
      .collection<Invitation>("invitations")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...updates, updatedAt: new Date() } }, { returnDocument: "after" })
    return result
  },
} 