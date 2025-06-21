import { MongoClient, type Db } from "mongodb"

// Enhanced environment variable validation with detailed logging
const MONGODB_URI = process.env.MONGODB_URI
console.log("Environment check - MONGODB_URI exists:", !!MONGODB_URI)
console.log("Environment check - MONGODB_URI length:", MONGODB_URI?.length || 0)

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is missing!")
  console.error(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("MONGO")),
  )
  throw new Error("Missing required environment variable: MONGODB_URI")
}

// Type assertion after validation
const VALIDATED_MONGODB_URI: string = MONGODB_URI

// Enhanced connection options with better error handling
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000, // Increased timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: "majority" as const,
  // Add these for better connection reliability
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Ensure this only runs on server side
if (typeof window !== "undefined") {
  throw new Error("MongoDB client should only be used on server side")
}

// Enhanced connection logic with retry mechanism
async function createConnection(): Promise<MongoClient> {
  console.log("🔄 Attempting to connect to MongoDB...")
  console.log("Connection URI (masked):", VALIDATED_MONGODB_URI.replace(/\/\/.*@/, "//***:***@"))

  try {
    const client = new MongoClient(VALIDATED_MONGODB_URI, options)
    await client.connect()

    // Test the connection immediately
    await client.db("admin").command({ ping: 1 })
    console.log("✅ MongoDB connection successful!")

    return client
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error)

    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        console.error("DNS resolution failed - check your MongoDB URI hostname")
      } else if (error.message.includes("authentication failed")) {
        console.error("Authentication failed - check your username and password")
      } else if (error.message.includes("timeout")) {
        console.error("Connection timeout - check your network and MongoDB Atlas IP whitelist")
      }
    }

    throw error
  }
}

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createConnection()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  clientPromise = createConnection()
}

export async function getDatabase(): Promise<Db> {
  try {
    console.log("🔄 Getting database connection...")
    const client = await clientPromise
    const db = client.db("trackflow")

    // Test the database connection
    await db.admin().ping()
    console.log("✅ Database connection verified")

    return db
  } catch (error) {
    console.error("❌ Database connection error:", error)

    // Enhanced error reporting
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Enhanced graceful shutdown
const gracefulShutdown = async () => {
  try {
    console.log("🔄 Closing MongoDB connection...")
    const client = await clientPromise
    await client.close()
    console.log("✅ MongoDB connection closed successfully")
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error)
  }
}

process.on("SIGINT", async () => {
  await gracefulShutdown()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await gracefulShutdown()
  process.exit(0)
})

export default clientPromise
