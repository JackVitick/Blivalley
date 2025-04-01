import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Session from "@/models/Session";
import Project from "@/models/Project";

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
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const active = url.searchParams.get("active") === "true";
    
    await connectToDatabase();
    
    const filter: any = { userId: session.user.id };
    
    if (projectId) {
      filter.projectId = projectId;
    }
    
    if (active !== undefined) {
      filter.isActive = active;
    }

    const sessions = await Session.find(filter)
      .sort({ startTime: -1 })
      .limit(limit);

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
    const { projectId, milestoneId, taskId, note } = body;

    if (!projectId || !milestoneId || !taskId) {
      return NextResponse.json(
        { error: "Project, milestone, and task IDs are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Verify the project belongs to the user
    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id
    });
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Find the milestone and task
    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }
    
    const task = milestone.tasks.id(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    // End any active sessions for this user
    await Session.updateMany(
      { userId: session.user.id, isActive: true },
      { 
        isActive: false,
        endTime: new Date(),
        $push: { 
          activities: { 
            timestamp: new Date(), 
            action: 'end',
            metadata: { reason: 'auto_ended_for_new_session' }
          } 
        }
      }
    );
    
    // Update task status to in_progress if not already
    if (task.status !== 'in_progress') {
      task.status = 'in_progress';
      
      // Update milestone status if needed
      if (milestone.status === 'not_started') {
        milestone.status = 'in_progress';
      }
      
      await project.save();
    }
    
    // Create the new session
    const newSession = await Session.create({
      userId: session.user.id,
      projectId,
      milestoneId,
      taskId,
      startTime: new Date(),
      isActive: true,
      note: note || '',
      activities: [{
        timestamp: new Date(),
        action: 'start'
      }]
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}