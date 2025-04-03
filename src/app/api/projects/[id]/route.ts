import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";

// GET a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to access this project" },
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

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
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

// PUT to update a project's status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update project status" },
        { status: 401 }
      );
    }

    const id = params.id;
    const body = await req.json();
    
    if (!body.status || !['active', 'completed', 'archived'].includes(body.status)) {
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

    project.status = body.status;
    await project.save();

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project status:", error);
    return NextResponse.json(
      { error: "Failed to update project status" },
      { status: 500 }
    );
  }
}