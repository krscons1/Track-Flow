import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface TimeLog {
  _id?: ObjectId
  taskId: ObjectId
  userId: ObjectId
  hours: number
  date: Date
  description?: string
  subtaskId?: ObjectId
  subtaskTitle?: string
  createdAt: Date
  // Pomodoro analytics fields
  pomodoroSessions?: number
  breakMinutes?: number
  breaksSkipped?: number
}

export class TimeLogModel {
  static async create(timeLogData: Omit<TimeLog, "_id" | "createdAt">): Promise<TimeLog> {
    const db = await getDatabase()
    const now = new Date()

    const timeLog: TimeLog = {
      ...timeLogData,
      createdAt: now,
    }

    const result = await db.collection("timelogs").insertOne(timeLog)
    return { ...timeLog, _id: result.insertedId }
  }

  static async findByTask(taskId: string): Promise<TimeLog[]> {
    const db = await getDatabase()
    return (await db
      .collection("timelogs")
      .find({ taskId: new ObjectId(taskId) })
      .toArray()) as TimeLog[]
  }

  static async find(query: any): Promise<TimeLog[]> {
    const db = await getDatabase()
    return (await db.collection("timelogs").find(query).toArray()) as TimeLog[]
  }

  static async deleteById(id: string, userId: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("timelogs").deleteOne({ _id: new ObjectId(id), userId: new ObjectId(userId) })
    return result.deletedCount === 1
  }
} 