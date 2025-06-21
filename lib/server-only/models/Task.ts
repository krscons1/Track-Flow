import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"
import { ProjectModel } from "./Project"

export interface Task {
  _id?: ObjectId
  title: string
  description: string
  status: "todo" | "in-progress" | "review" | "completed"
  priority: "low" | "medium" | "high"
  project: ObjectId
  assignee: ObjectId
  createdBy: ObjectId
  dueDate: Date
  estimatedHours: number
  actualHours: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export class TaskModel {
  static async create(taskData: Omit<Task, "_id" | "createdAt" | "updatedAt">): Promise<Task> {
    const db = await getDatabase()
    const now = new Date()

    const task: Task = {
      ...taskData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("tasks").insertOne(task)
    return { ...task, _id: result.insertedId }
  }

  static async findAll(): Promise<any[]> {
    const db = await getDatabase()
    return await db
      .collection("tasks")
      .aggregate([
        {
          $lookup: {
            from: "subtasks",
            localField: "_id",
            foreignField: "taskId",
            as: "subtasks",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "taskId",
            as: "comments",
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" },
            subtaskCount: {
              total: { $size: "$subtasks" },
              completed: {
                $size: {
                  $filter: {
                    input: "$subtasks",
                    as: "subtask",
                    cond: { $eq: ["$$subtask.completed", true] },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            comments: 0,
            subtasks: 0,
          },
        },
      ])
      .toArray()
  }

  static async findById(id: string): Promise<Task | null> {
    const db = await getDatabase()
    return (await db.collection("tasks").findOne({ _id: new ObjectId(id) })) as Task | null
  }

  static async findByProject(projectId: string): Promise<Task[]> {
    const db = await getDatabase()
    return (await db
      .collection("tasks")
      .find({ project: new ObjectId(projectId) })
      .toArray()) as Task[]
  }

  static async findByAssignee(assigneeId: string): Promise<Task[]> {
    const db = await getDatabase()
    return (await db
      .collection("tasks")
      .find({ assignee: new ObjectId(assigneeId) })
      .toArray()) as Task[]
  }

  static async updateById(id: string, updates: Partial<Task>): Promise<Task | null> {
    const db = await getDatabase()
    const result = await db
      .collection("tasks")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as Task | null
  }

  static async deleteById(id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("tasks").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }

  static async findForUser(userId: string): Promise<any[]> {
    const db = await getDatabase()
    const userObjectId = new ObjectId(userId)

    const userProjects = await ProjectModel.findForUser(userId)
    const projectIds = userProjects.map((p) => p._id)

    return await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            $or: [{ createdBy: userObjectId }, { assignee: userObjectId }, { project: { $in: projectIds } }],
          },
        },
        {
          $lookup: {
            from: "subtasks",
            localField: "_id",
            foreignField: "taskId",
            as: "subtasks",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "taskId",
            as: "comments",
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" },
            subtaskCount: {
              total: { $size: "$subtasks" },
              completed: {
                $size: {
                  $filter: {
                    input: "$subtasks",
                    as: "subtask",
                    cond: { $eq: ["$$subtask.completed", true] },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            comments: 0,
            subtasks: 0,
          },
        },
      ])
      .toArray()
  }
}
