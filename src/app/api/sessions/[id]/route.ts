import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Session from "@/models/Session";
import Project from "@/models/Project";

// GET specific session
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to access this session" },
        { status: 401 }
      );
    }

    const id = params.id;

    await connectToDatabase();

    const sessionData = await Session.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// PUT to update a session (end a session)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update this session" },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    
    await connectToDatabase();

    const sessionData = await Session.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // End the session
    sessionData.isActive = false;
    sessionData.endTime = new Date();
    
    // Calculate duration in seconds
    const durationInSeconds = Math.round(
      (sessionData.endTime.getTime() - sessionData.startTime.getTime()) / 1000
    );
    sessionData.duration = durationInSeconds;
    
    // Add session note if provided
    if (body.note) {
      sessionData.note = body.note;
    }
    
    // Record end activity
    sessionData.activities.push({
      timestamp: new Date(),
      action: 'end',
      metadata: body.metadata || {}
    });
    
    // Add environment snapshot if provided
    if (body.snapshot) {
      sessionData.snapshot = body.snapshot;
    }
    
    await sessionData.save();
    
    // Update task with last session information if provided
    if (body.taskStatus || body.taskNote) {
      const project = await Project.findOne({
        _id: sessionData.projectId,
        userId: session.user.id
      });
      
      if (project) {
        const milestone = project.milestones.id(sessionData.milestoneId);
        if (milestone) {
          const task = milestone.tasks.id(sessionData.taskId);
          if (task) {
            if (body.taskStatus) {
              task.status = body.taskStatus;
            }
            
            if (body.taskNote) {
              task.lastSession = {
                timestamp: new Date(),
                note: body.taskNote
              };
            }
            
            await project.save();
          }
        }
      }
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}