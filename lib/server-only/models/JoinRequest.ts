import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export interface JoinRequest {
  _id?: ObjectId
  teamId: ObjectId
  userId: ObjectId
  status: "pending" | "accepted" | "declined"
  createdAt: Date
  updatedAt: Date
}

export const JoinRequestModel = {
  async create(joinRequest: Omit<JoinRequest, "_id" | "createdAt" | "updatedAt">): Promise<JoinRequest> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<Omit<JoinRequest, "_id">>("joinRequests").insertOne({
      ...joinRequest,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    return { ...joinRequest, _id: result.insertedId, status: "pending", createdAt: now, updatedAt: now }
  },

  async findByTeamId(teamId: string): Promise<JoinRequest[]> {
    const db = await getDatabase()
    return db.collection<JoinRequest>("joinRequests").find({ teamId: new ObjectId(teamId) }).toArray()
  },

  async findByUserId(userId: string): Promise<JoinRequest[]> {
    const db = await getDatabase()
    return db.collection<JoinRequest>("joinRequests").find({ userId: new ObjectId(userId) }).toArray()
  },

  async updateById(id: string, updates: Partial<JoinRequest>): Promise<JoinRequest | null> {
    const db = await getDatabase()
    const result = await db
      .collection<JoinRequest>("joinRequests")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...updates, updatedAt: new Date() } }, { returnDocument: "after" })
    return result
  },
} 