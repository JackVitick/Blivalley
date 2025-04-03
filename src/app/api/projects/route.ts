import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import mongoose from "mongoose";

// GET projects
export async function GET(
  req: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to access projects" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // If params.id exists, fetch a specific project
    if (params?.id) {
      const project = await Project.findOne({
        _id: params.id,
        userId: session.user.id,
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(project);
    } 
    // Otherwise, fetch all projects for the user
    else {
      // Get query parameters
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const category = url.searchParams.get('category');
      
      // Build query
      const query: { userId: string; status?: string; category?: string } = { userId: session.user.id };
      
      if (status) {
        query.status = status;
      }
      
      if (category) {
        query.category = category;
      }
      
      const projects = await Project.find(query).sort({ createdAt: -1 });
      
      return NextResponse.json(projects);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// PUT to update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update this project" },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    
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

    // Update allowed fields
    const allowedFields = [
      "name", 
      "description", 
      "category", 
      "status", 
      "deadline", 
      "milestones", 
      "settings"
    ];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        project[field] = body[field];
      }
    }

    await project.save();

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to delete this project" },
        { status: 401 }
      );
    }

    const id = params.id;
    
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

    // Delete the project
    await Project.deleteOne({ _id: id, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

// POST to create a new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a project" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Convert userId to ObjectId
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Define types for milestone and task
    interface MilestoneInput {
      name: string;
      tasks?: (string | { name: string; status?: string; notes?: string })[];
    }

    // Transform milestones to match the schema
    const transformedMilestones = body.milestones?.map((milestone: MilestoneInput) => ({
      name: milestone.name,
      status: 'not_started',
      tasks: milestone.tasks?.map((task) => {
        if (typeof task === 'string') {
          return {
            name: task,
            status: 'not_started',
            notes: ''
          };
        } else {
          return {
            name: task.name,
            status: task.status || 'not_started',
            notes: task.notes || ''
          };
        }
      }) || []
    })) || [];

    // Create the project with default values for required fields
    const project = await Project.create({
      userId: userId,
      name: body.name,
      description: body.description || '',
      category: body.category,
      status: body.status || 'active',
      progress: 0,
      deadline: body.deadline ? new Date(body.deadline) : null,
      milestones: transformedMilestones,
      settings: {
        autoStart: body.settings?.autoStart || false,
        notifications: body.settings?.notifications || true
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}