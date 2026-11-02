import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: 'Researcher',
      trim: true
    },
    institution: {
      type: String,
      default: 'Academic Institution',
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    verificationToken: {
      type: String,
      default: null,
      index: true
    },
    verificationTokenExpires: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const User = mongoose.model('User', userSchema);
