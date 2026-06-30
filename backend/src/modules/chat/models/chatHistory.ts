import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  messages: {
    type: [chatMessageSchema],
    default: []
  }
}, {
  timestamps: true
});

chatHistorySchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('ChatHistory', chatHistorySchema) as any;
