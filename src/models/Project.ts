import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Task Interface
interface Task {
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string;
  lastSession?: {
    timestamp: Date;
    note: string;
  };
}

// Milestone Interface
interface Milestone {
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  tasks: Task[];
}

// Project Interface
export interface ProjectDocument extends Document {
  userId: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  milestones: Milestone[];
  settings: {
    autoStart: boolean;
    notifications: boolean;
  };
}

// Task Schema
const TaskSchema = new Schema<Task>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  notes: {
    type: String,
    default: ''
  },
  lastSession: {
    timestamp: {
      type: Date,
      default: null
    },
    note: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// Milestone Schema
const MilestoneSchema = new Schema<Milestone>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  tasks: [TaskSchema]
}, {
  timestamps: true
});

// Project Schema
const ProjectSchema = new Schema<ProjectDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    enum: ['design', 'development', 'writing', 'marketing', 'business', 'education', 'personal', 'home', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  deadline: {
    type: Date,
    default: null
  },
  milestones: [MilestoneSchema],
  settings: {
    autoStart: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for common queries
ProjectSchema.index({ userId: 1, status: 1 });
ProjectSchema.index({ userId: 1, category: 1 });
ProjectSchema.index({ userId: 1, deadline: 1 });

// Function to calculate project progress based on completed tasks
function calculateProgress(project: ProjectDocument) {
  const totalTasks = project.milestones.reduce((acc, milestone) => 
    acc + milestone.tasks.length, 0);
  
  if (totalTasks === 0) {
    project.progress = 0;
    return;
  }
  
  const completedTasks = project.milestones.reduce((acc, milestone) => 
    acc + milestone.tasks.filter(task => task.status === 'completed').length, 0);
  
  project.progress = Math.round((completedTasks / totalTasks) * 100);
}

// Pre-save middleware to calculate progress
ProjectSchema.pre('save', function(next) {
  if (this.isModified('milestones')) {
    calculateProgress(this);
  }
  next();
});

export default mongoose.models.Project || mongoose.model<ProjectDocument>('Project', ProjectSchema);