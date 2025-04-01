import mongoose, { Document, Model, Schema, Types } from 'mongoose';

// Application Interface
interface Application {
  name: string;
  type: 'application' | 'browser' | 'explorer';
  executablePath?: string;
  windowState?: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };
  openFiles?: string[];
}

// Browser Tab Interface
interface BrowserTab {
  url: string;
  title: string;
  favIconUrl?: string;
}

// Browser Interface
interface Browser {
  name: string;
  executablePath?: string;
  tabs: BrowserTab[];
}

// Activity Interface
interface Activity {
  timestamp: Date;
  action: 'start' | 'pause' | 'resume' | 'end' | 'snapshot_created' | 'snapshot_restored';
  metadata?: any;
}

// Session Document Interface
export interface SessionDocument extends Document {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  milestoneId: Types.ObjectId;
  taskId: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number;
  note: string;
  snapshotId?: Types.ObjectId;
  isActive: boolean;
  activities: Activity[];
  calculatedDuration: number;
  snapshot?: {
    applications: Application[];
    browsers: Browser[];
  };
}

// Application Schema
const ApplicationSchema = new Schema<Application>({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['application', 'browser', 'explorer'],
    default: 'application'
  },
  executablePath: {
    type: String,
    default: null
  },
  windowState: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    isMaximized: Boolean
  },
  openFiles: [String]
});

// Browser Tab Schema
const BrowserTabSchema = new Schema<BrowserTab>({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  favIconUrl: {
    type: String,
    default: null
  }
});

// Browser Schema
const BrowserSchema = new Schema<Browser>({
  name: {
    type: String,
    required: true
  },
  executablePath: {
    type: String,
    default: null
  },
  tabs: [BrowserTabSchema]
});

// Activity Schema
const ActivitySchema = new Schema<Activity>({
  timestamp: Date,
  action: {
    type: String,
    enum: ['start', 'pause', 'resume', 'end', 'snapshot_created', 'snapshot_restored']
  },
  metadata: Schema.Types.Mixed
});

// Session Schema
const SessionSchema = new Schema<SessionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  milestoneId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  taskId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  note: {
    type: String,
    default: ''
  },
  snapshotId: {
    type: Schema.Types.ObjectId,
    ref: 'SessionSnapshot',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  activities: [ActivitySchema],
  snapshot: {
    applications: [ApplicationSchema],
    browsers: [BrowserSchema]
  }
}, {
  timestamps: true
});

// Indexes for analytics
SessionSchema.index({ userId: 1, startTime: -1 });
SessionSchema.index({ projectId: 1, startTime: -1 });
SessionSchema.index({ taskId: 1 });

// Virtual for calculating duration
SessionSchema.virtual('calculatedDuration').get(function() {
  if (!this.endTime) {
    return Math.round((Date.now() - this.startTime.getTime()) / 1000);
  }
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
});

// Pre-save middleware to update duration
SessionSchema.pre('save', function(next) {
  if (this.endTime && !this.isActive) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  next();
});

export default mongoose.models.Session || mongoose.model<SessionDocument>('Session', SessionSchema);