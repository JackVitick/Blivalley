import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Session from "@/models/Session";
import Project from "@/models/Project";
import { Types } from 'mongoose';

interface SessionQuery {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  status?: 'active' | 'completed';
}

// GET all sessions for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to access sessions" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const active = url.searchParams.get("active") === "true";
    
    await connectToDatabase();
    
    const query: SessionQuery = { userId: new Types.ObjectId(session.user.id) };
    
    if (projectId) {
      query.projectId = new Types.ObjectId(projectId);
    }
    
    if (active) {
      query.status = 'active';
    }

    const sessions = await Session.find(query).sort({ startTime: -1 });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST to create a new session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.projectId || !body.milestoneId || !body.taskId) {
      return NextResponse.json(
        { error: "Project ID, milestone ID, and task ID are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if project exists and belongs to user
    const project = await Project.findOne({
      _id: body.projectId,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if there's already an active session
    const activeSession = await Session.findOne({
      userId: session.user.id,
      status: 'active'
    });

    if (activeSession) {
      return NextResponse.json({ error: 'You already have an active session' }, { status: 400 });
    }

    // Create the session
    const newSession = await Session.create({
      userId: session.user.id,
      projectId: body.projectId,
      milestoneId: body.milestoneId,
      taskId: body.taskId,
      startTime: new Date(),
      status: 'active',
      note: ''
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, note } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const updatedSession = await Session.findOneAndUpdate(
      { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(session.user.id) },
      {
        status: 'completed',
        endTime: new Date(),
        note: note || ''
      },
      { new: true }
    );

    if (!updatedSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}