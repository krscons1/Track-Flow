import { type NextRequest, NextResponse } from "next/server"
import { UserModel } from "@/lib/server-only/models/User"
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/server-only/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Login attempt started")

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Invalid JSON in request body:", error)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.log("❌ Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (typeof email !== "string" || typeof password !== "string") {
      console.log("❌ Invalid input format")
      return NextResponse.json({ error: "Invalid input format" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log("🔄 Login attempt for email:", normalizedEmail)

    // Find user by email with enhanced error handling
    let user
    try {
      console.log("🔄 Searching for user in database...")
      user = await UserModel.findByEmail(normalizedEmail)
      console.log("✅ Database query completed, user found:", !!user)
    } catch (error) {
      console.error("❌ Database error finding user:", error)

      // Provide more specific error information
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })

        // Check if it's a connection error
        if (
          error.message.includes("Failed to connect to database") ||
          error.message.includes("connection") ||
          error.message.includes("timeout")
        ) {
          return NextResponse.json(
            {
              error: "Database connection error",
              details: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 500 },
          )
        }
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

    if (!user) {
      console.log("❌ User not found for email:", normalizedEmail)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("✅ User found:", user.email)

    // Verify password
    let isValidPassword
    try {
      isValidPassword = await verifyPassword(password, user.password)
    } catch (error) {
      console.error("❌ Password verification error:", error)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", normalizedEmail)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("✅ Password verified for user:", normalizedEmail)

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

    console.log("✅ Token generated for user:", normalizedEmail)

    // Set auth cookie
    try {
      await setAuthCookie(token)
    } catch (error) {
      console.error("❌ Cookie setting error:", error)
      return NextResponse.json({ error: "Session creation error" }, { status: 500 })
    }

    console.log("✅ Cookie set for user:", normalizedEmail)

    // Set lastLogin on successful login
    await UserModel.updateById(user._id!.toString(), { lastLogin: new Date() })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        _id: user._id!.toString(),
      },
      message: "Login successful",
    })
  } catch (error) {
    console.error("❌ Login error:", error)
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
