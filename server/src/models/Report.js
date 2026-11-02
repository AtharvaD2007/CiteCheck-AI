import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    id: {
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
    title: {
      type: String,
      required: true,
      trim: true
    },
    input: {
      claim: { type: String, default: '' },
      citation: { type: String, default: '' },
      sourcePassage: { type: String, default: '' }
    },
    report: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

// Compound index for fast queries and isolation by user
reportSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
