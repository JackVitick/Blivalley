import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../../auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";

// PUT to update a task's status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; milestoneId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update task status" },
        { status: 401 }
      );
    }

    const { id, milestoneId, taskId } = params;
    const body = await req.json();
    
    if (!body.status || !['not_started', 'in_progress', 'completed'].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    await connectToDatabase();

    const project = await Project.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Find the milestone
    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Find the task
    const task = milestone.tasks.id(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Update task status
    task.status = body.status;
    
    // If status changed to in_progress, add last session info
    if (body.status === 'in_progress' && body.note) {
      task.lastSession = {
        timestamp: new Date(),
        note: body.note
      };
    }
    
    // Update milestone status based on tasks
    const allTasksCompleted = milestone.tasks.every(t => t.status === 'completed');
    const anyTaskInProgress = milestone.tasks.some(t => t.status === 'in_progress');
    const allTasksNotStarted = milestone.tasks.every(t => t.status === 'not_started');
    
    if (allTasksCompleted) {
      milestone.status = 'completed';
    } else if (anyTaskInProgress) {
      milestone.status = 'in_progress';
    } else if (allTasksNotStarted) {
      milestone.status = 'not_started';
    }
    
    await project.save();

    return NextResponse.json({
      task: {
        id: taskId,
        status: task.status,
        lastSession: task.lastSession
      },
      milestone: {
        id: milestoneId,
        status: milestone.status
      },
      project: {
        id: project._id,
        progress: project.progress
      }
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}