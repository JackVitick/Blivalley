import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";

// PUT to update a milestone's status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update milestone status" },
        { status: 401 }
      );
    }

    const { id, milestoneId } = params;
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

    // Update milestone status
    milestone.status = body.status;
    
    // When setting milestone to completed, mark all tasks as completed
    if (body.status === 'completed') {
      milestone.tasks.forEach(task => {
        task.status = 'completed';
      });
    }
    
    // When setting milestone to in progress, set not-started tasks to in_progress
    if (body.status === 'in_progress' && milestone.tasks.some(t => t.status === 'not_started')) {
      const firstNotStartedTask = milestone.tasks.find(t => t.status === 'not_started');
      if (firstNotStartedTask) {
        firstNotStartedTask.status = 'in_progress';
      }
    }
    
    await project.save();

    return NextResponse.json({
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
    console.error("Error updating milestone status:", error);
    return NextResponse.json(
      { error: "Failed to update milestone status" },
      { status: 500 }
    );
  }
}