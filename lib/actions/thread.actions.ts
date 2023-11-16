"use server";
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

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
    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    //Update user model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    //revalidate the path. that is going to make sure that is the chages happens imidiately.
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    connectToDB();

    //calculate the number of posts to skip->
    const skipAmount = (pageNumber - 1) * pageSize;

    //now fetch that threads which has no parents coz they are the top level threads ->
    const postQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User }) //this will get us the author details from the user model as well for every thread.
      .populate({
        path: "children", //path = the name of property in the Thread model.
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image",
        },
      });

    const totalPostCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postQuery.exec();

    const isNext = totalPostCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (error: any) {
    throw new Error(
      `Something went wrong in fetchPosts action. ${error.message}`
    );
  }
}

export async function fetchThreadById(id: string) {
  try {
    connectToDB();

    //Todo: Populate community
    const thread = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        //populating the childrens thread or comments
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    return thread;
  } catch (error: any) {
    console.log(error);
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
