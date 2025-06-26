import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export interface ActivityLog {
  _id?: ObjectId
  teamId: ObjectId
  userId: ObjectId
  userName: string
  type: string // e.g. 'project_created', 'task_completed'
  description: string
  entityId?: ObjectId
  entityName?: string
  createdAt: Date
}

export const ActivityLogModel = {
  async create(activity: Omit<ActivityLog, "_id" | "createdAt">): Promise<ActivityLog> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<ActivityLog>("activityLogs").insertOne({
      ...activity,
      createdAt: now,
    })
    return { ...activity, _id: result.insertedId, createdAt: now }
  },

  async findRecentByTeam(teamId: string, excludeUserId?: string, limit = 3, userId?: string, type?: string): Promise<ActivityLog[]> {
    const db = await getDatabase()
    const query: any = { teamId: new ObjectId(teamId) }
    if (excludeUserId) query.userId = { $ne: new ObjectId(excludeUserId) }
    if (userId) query.userId = new ObjectId(userId)
    if (type) query.type = type
    return db
      .collection<ActivityLog>("activityLogs")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  },
} 