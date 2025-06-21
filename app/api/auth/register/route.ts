import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/server-only/models/User"
import { hashPassword, generateToken, setAuthCookie } from "@/lib/server-only/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Registration attempt started")

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Invalid JSON in request body:", error)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { name, email, password, role } = body

    console.log("🔄 Registration attempt for:", { name, email, role })

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return NextResponse.json({ error: "Invalid input format" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedName = name.trim()

    // Check if user already exists with enhanced error handling
    let existingUser
    try {
      console.log("🔄 Checking for existing user...")
      existingUser = await UserModel.findByEmail(normalizedEmail)
      console.log("✅ Existing user check completed")
    } catch (error) {
      console.error("❌ Database error checking existing user:", error)

      if (error instanceof Error && error.message.includes("Failed to connect to database")) {
        return NextResponse.json(
          {
            error: "Database connection error",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "Database error",
          details:
            process.env.NODE_ENV === "development"
              ? error instanceof Error
                ? error.message
                : "Unknown error"
              : undefined,
        },
        { status: 500 },
      )
    }

    if (existingUser) {
      console.log("❌ User already exists:", normalizedEmail)
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    console.log("✅ No existing user found, proceeding with registration")

    // Hash password
    let hashedPassword
    try {
      hashedPassword = await hashPassword(password)
    } catch (error) {
      console.error("❌ Password hashing error:", error)
      return NextResponse.json({ error: "Password processing error" }, { status: 500 })
    }

    console.log("✅ Password hashed successfully")

    // Create user
    let user
    try {
      console.log("🔄 Creating user in database...")
      user = await UserModel.create({
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        role: role as "admin" | "member",
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`,
      })
      console.log("✅ User created successfully:", user._id)
    } catch (error) {
      console.error("❌ User creation error:", error)

      if (error instanceof Error && error.message.includes("Failed to connect to database")) {
        return NextResponse.json(
          {
            error: "Database connection error",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "User creation failed",
          details:
            process.env.NODE_ENV === "development"
              ? error instanceof Error
                ? error.message
                : "Unknown error"
              : undefined,
        },
        { status: 500 },
      )
    }

    // Generate JWT token
    let token
    try {
      token = generateToken({
        userId: user._id!.toString(),
        email: user.email,
        role: user.role,
      })
    } catch (error) {
      console.error("❌ Token generation error:", error)
      return NextResponse.json({ error: "Authentication token error" }, { status: 500 })
    }

    console.log("✅ Token generated for new user")

    // Set auth cookie
    try {
      await setAuthCookie(token)
    } catch (error) {
      console.error("❌ Cookie setting error:", error)
      return NextResponse.json({ error: "Session creation error" }, { status: 500 })
    }

    console.log("✅ Cookie set for new user")

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(
      {
        user: {
          ...userWithoutPassword,
          _id: user._id!.toString(),
        },
        message: "Registration successful",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Registration error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}
