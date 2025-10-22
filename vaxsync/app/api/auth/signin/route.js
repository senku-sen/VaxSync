import { NextResponse } from "next/server";
import { readUsers } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // For simplicity, return basic success. In a real app you'd set a session cookie/JWT.
    return NextResponse.json({ ok: true, id: user.id, firstName: user.firstName });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


