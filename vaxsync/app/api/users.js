import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.role || !body.barangay) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check for duplicate email
    if (users.some((u) => u.email === body.email)) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      role: body.role,
      barangay: body.barangay,
      status: body.status || "Active",
    }

    users.push(newUser)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
