import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface UserDocument extends Document {
  email: string;
  password?: string;
  displayName: string;
  photoURL?: string;
  authProvider: string;
  authId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    sessionCapture: {
      enabled: boolean;
      captureApps: boolean;
      captureBrowsers: boolean;
      saveLocation: 'local' | 'cloud' | 'none';
    }
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid email address!`
    }
  },
  displayName: {
    type: String,
    trim: true,
    required: true
  },
  photoURL: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    required: true,
    enum: ['google', 'apple', 'github', 'email']
  },
  authId: {
    type: String
  },
  password: {
    type: String,
    required: function(this: UserDocument) {
      return this.authProvider === 'email';
    }
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    sessionCapture: {
      enabled: {
        type: Boolean,
        default: true
      },
      captureApps: {
        type: Boolean,
        default: true
      },
      captureBrowsers: {
        type: Boolean,
        default: true
      },
      saveLocation: {
        type: String,
        enum: ['local', 'cloud', 'none'],
        default: 'local'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for OAuth provider lookup
UserSchema.index({ authProvider: 1, authId: 1 }, { unique: true });

// Pre-save hook to hash passwords
UserSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if the model is already defined to avoid overwriting it during hot reloads
export default mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);