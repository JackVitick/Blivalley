import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { rateLimit } from "@/lib/rate-limit";

// Rate limit configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function POST(req: NextRequest) {
  try {
    console.log('Starting user registration process...');
    
    // Apply rate limiting
    try {
      await limiter.check(5, 'REGISTER_IP'); // 5 requests per minute
    } catch {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password } = body;

    console.log('Registration attempt for email:', email);

    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Password does not meet requirements');
      return NextResponse.json(
        { 
          error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
        },
        { status: 400 }
      );
    }

    console.log('Attempting to connect to database...');
    await connectToDatabase();
    console.log('Successfully connected to database');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    console.log('Creating new user...');
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

    console.log('User created successfully:', { id: newUser._id, email: newUser.email });

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