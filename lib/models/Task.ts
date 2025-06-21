// Only import MongoDB on server side
let getDatabase: typeof import("@/lib/mongodb").getDatabase
let ObjectId: typeof import("mongodb").ObjectId

const getServerModules = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Task model should only be used on server side")
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

export interface Task {
  _id?: import("mongodb").ObjectId
  title: string
  description: string
  status: "todo" | "in-progress" | "review" | "completed"
  priority: "low" | "medium" | "high"
  project: import("mongodb").ObjectId
  assignee: import("mongodb").ObjectId
  createdBy: import("mongodb").ObjectId
  dueDate: Date
  estimatedHours: number
  actualHours: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export class TaskModel {
  static async create(taskData: Omit<Task, "_id" | "createdAt" | "updatedAt">): Promise<Task> {
    const { getDatabase } = await getServerModules()
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

  static async findAll(): Promise<Task[]> {
    const { getDatabase } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("tasks").find({}).toArray()) as Task[]
  }

  static async findById(id: string): Promise<Task | null> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db.collection("tasks").findOne({ _id: new ObjectId(id) })) as Task | null
  }

  static async findByProject(projectId: string): Promise<Task[]> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db
      .collection("tasks")
      .find({ project: new ObjectId(projectId) })
      .toArray()) as Task[]
  }

  static async findByAssignee(assigneeId: string): Promise<Task[]> {
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    return (await db
      .collection("tasks")
      .find({ assignee: new ObjectId(assigneeId) })
      .toArray()) as Task[]
  }

  static async updateById(id: string, updates: Partial<Task>): Promise<Task | null> {
    const { getDatabase, ObjectId } = await getServerModules()
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
    const { getDatabase, ObjectId } = await getServerModules()
    const db = await getDatabase()
    const result = await db.collection("tasks").deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount === 1
  }
}
