import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Community",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      parentId: { //in case this thread is a comment.
        type: String,
      },
      children: [ //and this is all the comment threads (its like recursion)
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Thread",
        },
      ],
      likeCount: { type: Number, default: 0 }  // quick access

      //so this like ->
      /*
       Thread Original
          -> Thread comment1
          -> Thread comment2
                -> Thread comment2-1
          -> Thread comment3
      */
        
});

const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);

export default Thread;