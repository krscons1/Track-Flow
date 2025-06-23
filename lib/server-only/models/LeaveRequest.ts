import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export interface LeaveRequest {
  _id?: ObjectId
  teamId: ObjectId
  userId: ObjectId
  reason: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
  updatedAt: Date
}

export const LeaveRequestModel = {
  async create(leaveRequest: Omit<LeaveRequest, "_id" | "createdAt" | "updatedAt" | "status">): Promise<LeaveRequest> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<Omit<LeaveRequest, "_id">>("leaveRequests").insertOne({
      ...leaveRequest,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    return { ...leaveRequest, _id: result.insertedId, status: "pending", createdAt: now, updatedAt: now }
  },
  async findByTeamId(teamId: string): Promise<LeaveRequest[]> {
    const db = await getDatabase()
    return db.collection<LeaveRequest>("leaveRequests").find({ teamId: new ObjectId(teamId) }).toArray()
  },
  async findByUserId(userId: string): Promise<LeaveRequest[]> {
    const db = await getDatabase()
    return db.collection<LeaveRequest>("leaveRequests").find({ userId: new ObjectId(userId) }).toArray()
  },
  async updateById(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | null> {
    const db = await getDatabase()
    const result = await db
      .collection<LeaveRequest>("leaveRequests")
      .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...updates, updatedAt: new Date() } }, { returnDocument: "after" })
    return result
  },
} 