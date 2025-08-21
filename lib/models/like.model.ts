import mongoose, { Schema, Document, Types } from "mongoose";
export interface ILike extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  thread: Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  thread: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Thread", 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// prevent duplicate likes (user can like a thread only once)
likeSchema.index({ user: 1, thread: 1 }, { unique: true });

// ✅ IMPORTANT: use the same string "Like" everywhere
const Like = mongoose.models.Like || mongoose.model<ILike>("Like", likeSchema);

export default Like;
