// Only import MongoDB on server side
let getDatabase: typeof import("@/lib/mongodb").getDatabase
let ObjectId: typeof import("mongodb").ObjectId

const getServerModules = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Project model should only be used on server side")
  }

  if (!getDatabase) {
    const mongoModule = await import("@/lib/mongodb")
    getDatabase = mongoModule.getDatabase
  }
  if (!ObjectId) {
    const mongodbModule = await import("mongodb")
    ObjectId = mongodbModule.ObjectId
  }

  return { getDatabase, ObjectId }
}

export interface Project {
  _id?: import("mongodb").ObjectId
  title: string
  description: string
  status: "not-started" | "in-progress" | "completed" | "on-hold"
  priority: "low" | "medium" | "high"
  progress: number
  startDate: Date
  dueDate: Date
  owner: import("mongodb").ObjectId
  members: import("mongodb").ObjectId[]
  color: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export class ProjectModel {
  static async create(projectData: Omit<Project, "_id" | "createdAt" | "updatedAt">): Promise<Project> {
    const { getDatabase } = await getServerModules()
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
    const { getDatabase } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("projects").find({}).toArray()) as Project[]
  }

  static async findById(id: string): Promise<Project | null> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("projects").findOne({ _id: new ObjectId(id) })) as Project | null
  }

  static async findByOwner(ownerId: string): Promise<Project[]> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db
      .collection("projects")
      .find({ owner: new ObjectId(ownerId) })
      .toArray()) as Project[]
  }

  static async findByMember(memberId: string): Promise<Project[]> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db
      .collection("projects")
      .find({ members: new ObjectId(memberId) })
      .toArray()) as Project[]
  }

  static async updateById(id: string, updates: Partial<Project>): Promise<Project | null> {
    const { getDatabase, ObjectId } = await getServerModules()
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
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const result = await db.collection("projects").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}
