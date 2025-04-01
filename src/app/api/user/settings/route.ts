import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

// GET user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to access your settings" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('settings displayName email photoURL');

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      settings: user.settings
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

// PUT to update user settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update your settings" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    await connectToDatabase();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update profile information if provided
    if (body.displayName !== undefined) {
      user.displayName = body.displayName;
    }
    
    if (body.photoURL !== undefined) {
      user.photoURL = body.photoURL;
    }
    
    // Update settings if provided
    if (body.settings) {
      // Theme
      if (body.settings.theme !== undefined) {
        user.settings.theme = body.settings.theme;
      }
      
      // Notifications
      if (body.settings.notifications !== undefined) {
        user.settings.notifications = body.settings.notifications;
      }
      
      // Session capture settings
      if (body.settings.sessionCapture) {
        if (body.settings.sessionCapture.enabled !== undefined) {
          user.settings.sessionCapture.enabled = body.settings.sessionCapture.enabled;
        }
        
        if (body.settings.sessionCapture.captureApps !== undefined) {
          user.settings.sessionCapture.captureApps = body.settings.sessionCapture.captureApps;
        }
        
        if (body.settings.sessionCapture.captureBrowsers !== undefined) {
          user.settings.sessionCapture.captureBrowsers = body.settings.sessionCapture.captureBrowsers;
        }
        
        if (body.settings.sessionCapture.saveLocation !== undefined) {
          user.settings.sessionCapture.saveLocation = body.settings.sessionCapture.saveLocation;
        }
      }
    }

    await user.save();

    return NextResponse.json({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      settings: user.settings
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}