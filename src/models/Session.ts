import mongoose, { Schema, Document } from 'mongoose';

export interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  milestoneId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed';
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema({
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
    type: String,
    required: true
  },
  taskId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for common queries
SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ projectId: 1, status: 1 });
SessionSchema.index({ userId: 1, projectId: 1 });

const Session = mongoose.models.Session || mongoose.model<SessionDocument>('Session', SessionSchema);

export default Session;