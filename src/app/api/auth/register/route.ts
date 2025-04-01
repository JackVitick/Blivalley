import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create the user with default settings
    const newUser = await User.create({
      email,
      displayName: name,
      password, // Will be hashed by the pre-save hook in the User model
      authProvider: 'email',
      settings: {
        theme: 'system',
        notifications: true,
        sessionCapture: {
          enabled: true,
          captureApps: true,
          captureBrowsers: true,
          saveLocation: 'local'
        }
      }
    });

    // Remove sensitive information from the response
    const user = {
      id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
    };

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error in registration:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}