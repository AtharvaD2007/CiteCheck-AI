import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Automatically expires sessions after 30 days
      expires: 60 * 60 * 24 * 30
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const Session = mongoose.model('Session', sessionSchema);
