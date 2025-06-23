import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/server-only/mongodb"

export interface Notification {
  _id?: ObjectId
  userId: ObjectId
  type: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}

export const NotificationModel = {
  async create(notification: Omit<Notification, "_id" | "createdAt" | "read">): Promise<Notification> {
    const db = await getDatabase()
    const now = new Date()
    const result = await db.collection<Omit<Notification, "_id">>("notifications").insertOne({
      ...notification,
      read: false,
      createdAt: now,
    })
    return { ...notification, _id: result.insertedId, read: false, createdAt: now }
  },
  async findByUserId(userId: string): Promise<Notification[]> {
    const db = await getDatabase()
    return db.collection<Notification>("notifications").find({ userId: new ObjectId(userId) }).toArray()
  },
  async deleteById(id: string, userId: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("notifications").deleteOne({ _id: new ObjectId(id), userId: new ObjectId(userId) })
    return result.deletedCount === 1
  },
  async deleteAllByUserId(userId: string): Promise<number> {
    const db = await getDatabase()
    const result = await db.collection("notifications").deleteMany({ userId: new ObjectId(userId) })
    return result.deletedCount || 0
  },
  async markAllAsReadByUserId(userId: string): Promise<number> {
    const db = await getDatabase()
    const result = await db.collection("notifications").updateMany({ userId: new ObjectId(userId), read: false }, { $set: { read: true } })
    return result.modifiedCount || 0
  },
} 