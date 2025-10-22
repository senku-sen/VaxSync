import { NextResponse } from "next/server";
import { readUsers, writeUsers } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, month, date, year, sex, address, email, password } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const users = readUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const user = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      dob: { month, date, year },
      sex,
      address,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    writeUsers(users);

    return NextResponse.json({ ok: true, id: user.id });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


