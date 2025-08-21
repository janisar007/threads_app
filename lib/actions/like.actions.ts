"use server";
import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import Like from "../models/like.model";
import Thread from "../models/thread.model";

export async function likeThread({
  threadId,
  userId,
  path,
}: {
  threadId: string;
  userId: string;
  path: string;
}) {
  try {
    connectToDB();

    // Check if already liked
    const existingLike = await Like.findOne({ thread: threadId, user: userId });
    if (existingLike) {
      throw new Error("User already liked this thread");
    }

    // Add like entry
    await Like.create({ thread: threadId, user: userId });

    // Increment like count
    await Thread.findByIdAndUpdate(threadId, { $inc: { likeCount: 1 } });

    // Optional: add to user "likes" if you want to track what user liked
    // await User.findByIdAndUpdate(userId, { $push: { likedThreads: threadId } });

    revalidatePath(path);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Error liking thread: ${error.message}`);
  }
}


export async function unlikeThread({
  threadId,
  userId,
  path,
}: {
  threadId: string;
  userId: string;
  path: string;
}) {
  try {
    connectToDB();

    // Remove like entry
    const deleted = await Like.findOneAndDelete({ thread: threadId, user: userId });
    if (!deleted) {
      throw new Error("Like not found for this user & thread");
    }

    // Decrement like count
    await Thread.findByIdAndUpdate(threadId, { $inc: { likeCount: -1 } });

    // Optional: remove from user "likes"
    // await User.findByIdAndUpdate(userId, { $pull: { likedThreads: threadId } });

    revalidatePath(path);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Error unliking thread: ${error.message}`);
  }
}


export async function getThreadLikes(threadId: string) {
  try {
    await connectToDB();

    // find likes for this thread and populate user info
    const likes = await Like.find({ thread: threadId })
      .populate("user", "name username image bio _id")
      .lean();

    // extract only the user objects
    const users = likes.map((like) => like.user);

    return users; // array of { _id, name, username, image, bio }
  } catch (err) {
    console.error("❌ Error fetching thread likes:", err);
    return [];
  }
}