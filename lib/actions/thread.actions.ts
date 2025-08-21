"use server";
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import Community from "../models/community.model";
import { connectToDB } from "../mongoose";
import Like from "../models/like.model";

import { Types } from "mongoose";

interface PopulatedLike {
  _id: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    name: string;
    image?: string;
  };
}

export interface ThreadWithLikes {
  _id: Types.ObjectId;
  text: string;
  author: any; // or a refined populated type
  community: any;
  children: any[];
  likeCount: number;
  likes: PopulatedLike[];
  isLikedByCurrentUser: boolean;
  createdAt: Date;
}

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      author,
      community: communityIdObject,
    });

    //Update user model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    //revalidate the path. that is going to make sure that is the chages happens imidiately.
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

export async function fetchPosts(
  pageNumber = 1,
  pageSize = 20,
  userId?: string // ✅ pass current logged-in user ID
) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    // fetch parent threads only
    const postQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User })
      .populate({ path: "community", model: Community })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image",
        },
      })
      .lean();

    const totalPostCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postQuery.exec();

    // ✅ If user is logged in, get which posts they liked
    let likedPostIds: Set<string> = new Set();
    if (userId) {
      const likes = await Like.find({
        thread: { $in: posts.map((p) => p._id) },
        user: userId,
      }).lean();

      likedPostIds = new Set(likes.map((like) => like.thread.toString()));
    }

    // build final result
    const result = posts.map((post: any) => ({
      ...post,
      likeCount: post.likeCount || 0,
      isLikedByCurrentUser: userId
        ? likedPostIds.has(post._id.toString())
        : false,
    }));

    const isNext = totalPostCount > skipAmount + posts.length;
    return { posts: result, isNext } as any;
  } catch (error: any) {
    throw new Error(
      `Something went wrong in fetchPosts action. ${error.message}`
    );
  }
}

export async function fetchThreadById(
  id: string,
  userId?: string
): Promise<ThreadWithLikes | null> {
  try {
    connectToDB();

    const thread: any = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children", // keep nested but no need to calculate deeper
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .lean();

    if (!thread) throw new Error("Thread not found");

    // --- Main thread likes ---
    const likes = await Like.find({ thread: id })
      .populate("user", "_id name image")
      .lean();

    let isLikedByCurrentUser = false;
    if (userId) {
      isLikedByCurrentUser = likes.some(
        (l) => l.user._id.toString() === userId.toString()
      );
    }

    // --- Children likes in ONE query ---
    const childIds = (thread.children || []).map((c: any) => c._id);
    const childrenLikes = await Like.find({ thread: { $in: childIds } })
      .populate("user", "_id name image")
      .lean();

    // Group likes by threadId
    const likesMap = childrenLikes.reduce((acc: any, like: any) => {
      const tid = like.thread.toString();
      if (!acc[tid]) acc[tid] = [];
      acc[tid].push(like);
      return acc;
    }, {});

    // Attach likes + isLikedByCurrentUser to each child
    thread.children = (thread.children || []).map((child: any) => {
      const childLikes = likesMap[child._id.toString()] || [];

      let childIsLiked = false;
      if (userId) {
        childIsLiked = childLikes.some(
          (l: any) => l.user._id.toString() === userId.toString()
        );
      }

      return {
        ...child,
        likes: childLikes,
        isLikedByCurrentUser: childIsLiked, // ✅ directly inside child
      };
    });

    return {
      ...thread,
      likes,
      isLikedByCurrentUser,
    } as any;
  } catch (error: any) {
    throw new Error(
      `Something went wrong in fetchThread by id action. ${error.message}`
    );
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  try {
    connectToDB();

    //1. Find original thread->
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    //2. Create a new thread with the comment text->
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    //3.Save the new Thread->
    const savedCommentThread = await commentThread.save();

    //4.Update the original thread to include the new comment ->
    originalThread.children.push(savedCommentThread._id);

    //5. Save the original thread ->
    await originalThread.save();

    revalidatePath(path);
  } catch (error: any) {
    console.log("Error while adding comment: ", error);
    throw new Error("Unable to add comment");
  }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentId: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}
