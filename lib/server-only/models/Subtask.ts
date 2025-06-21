import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface Subtask {
  _id?: ObjectId
  title: string
  description: string
  completed: boolean
  taskId: ObjectId
  assignee?: ObjectId
  createdAt: Date
  updatedAt: Date
}

export class SubtaskModel {
  static async create(subtaskData: Omit<Subtask, "_id" | "createdAt" | "updatedAt">): Promise<Subtask> {
    const db = await getDatabase()
    const now = new Date()

    const subtask: Subtask = {
      ...subtaskData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("subtasks").insertOne(subtask)
    return { ...subtask, _id: result.insertedId }
  }

  static async findByTaskId(taskId: string): Promise<Subtask[]> {
    const db = await getDatabase()
    return (await db
      .collection("subtasks")
      .find({ taskId: new ObjectId(taskId) })
      .toArray()) as Subtask[]
  }

  static async updateById(id: string, updates: Partial<Subtask>): Promise<Subtask | null> {
    const db = await getDatabase()
    const result = await db
      .collection("subtasks")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as Subtask | null
  }
} 