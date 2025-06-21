import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface Project {
  _id?: ObjectId
  title: string
  description: string
  status: "not-started" | "in-progress" | "completed" | "on-hold"
  priority: "low" | "medium" | "high"
  progress: number
  startDate: Date
  dueDate: Date
  owner: ObjectId
  members: ObjectId[]
  color: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export class ProjectModel {
  static async create(projectData: Omit<Project, "_id" | "createdAt" | "updatedAt">): Promise<Project> {
    const db = await getDatabase()
    const now = new Date()

    const project: Project = {
      ...projectData,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("projects").insertOne(project)
    return { ...project, _id: result.insertedId }
  }

  static async findAll(): Promise<Project[]> {
    const db = await getDatabase()
    return (await db.collection("projects").find({}).toArray()) as Project[]
  }

  static async findById(id: string): Promise<Project | null> {
    const db = await getDatabase()
    return (await db.collection("projects").findOne({ _id: new ObjectId(id) })) as Project | null
  }

  static async findByOwner(ownerId: string): Promise<Project[]> {
    const db = await getDatabase()
    return (await db
      .collection("projects")
      .find({ owner: new ObjectId(ownerId) })
      .toArray()) as Project[]
  }

  static async findByMember(memberId: string): Promise<Project[]> {
    const db = await getDatabase()
    return (await db
      .collection("projects")
      .find({ members: new ObjectId(memberId) })
      .toArray()) as Project[]
  }

  static async findForUser(userId: string): Promise<Project[]> {
    const db = await getDatabase()
    const userObjectId = new ObjectId(userId)
    return (await db
      .collection("projects")
      .find({
        $or: [{ owner: userObjectId }, { members: userObjectId }],
      })
      .toArray()) as Project[]
  }

  static async updateById(id: string, updates: Partial<Project>): Promise<Project | null> {
    const db = await getDatabase()
    const result = await db
      .collection("projects")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: "after" },
      )
    return result as Project | null
  }

  static async deleteById(id: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}
