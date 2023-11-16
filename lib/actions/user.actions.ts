"use server";

import { FilterQuery, SortOrder } from "mongoose";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import { revalidatePath } from "next/cache";
import { AnyAaaaRecord } from "dns";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  connectToDB();

  try {
    await User.findOneAndUpdate(
      { id: userId },
      { username: username.toLowerCase(), name, bio, image, onboarded: true },
      { upsert: true } //via this it will do updation and insertion both
    );

    if (path === "/profile/edit") {
      revalidatePath(path); //it is a nextjs function that re validate the user data on the given path.
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    const user = await User.findOne({id: userId});
    
    return user;

  } catch (error: any) {
    throw new Error("something went wrong", error);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    //Find all threads authored by user with the given userId->
    const threads = await User.findOne({id: userId})
    .populate({
      path: 'threads',
      model: Thread,
      populate: {
        path: 'children',
        model: User,
        select: 'name image id'
      }
      //TODO: populate community as well
    })

    return threads;
  } catch (error: any) {
    throw new Error("Something went worng in fetchUserPost action", error.message);
  }
}

//Fetch a bunch of users ->
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc"
} : {
  userId: string; 
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    
    connectToDB();

    //Do paginations like before ->
    const skipAmount = (pageNumber - 1) * pageSize;

    const regex = new RegExp(searchString, "i");

    //fist fillter out the current user
    const query: FilterQuery<typeof User> = {
      id: {$ne: userId}
    }

    //now search the search string
    if(searchString.trim() !== '') {
      query.$or = [
        {username: { $regex: regex }},
        {name: {$regex: regex}}
      ]
    }

    //now sort 
    const sortOptions = { createdAt: sortBy };

    const userQuery = User.find(query)
    .sort(sortOptions)
    .skip(skipAmount)
    .limit(pageSize);

    const totalUserCount = await User.countDocuments(query);

    const users = await userQuery.exec();

    const isNext = totalUserCount > skipAmount + users.length;

    return { users, isNext };

  } catch (error: any) {
    throw new Error("Something went worng in fetchUsers action", error.message);
  }
}


export async function getActivity(userId: string) {
  try {
    connectToDB();

    //First find all the threads created by the user ->
    const userThreads = await Thread.find({author: userId});

    //Now collect all the child thread ids (replies) from the childern field->
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children)
    }, []) //Here reduce function will take all the threads by the user. and will extract all the children(the field) that is the comment thread ids and then put it into the userThreads array.
    //second argument [] is an empty array for acc.

    //now getting  the actual replies and excluding the current users replies ->
    const replies = await Thread.find({
      _id: {$in: childThreadIds},
      author: {$ne: userId}
    }).populate({
      path: 'author',
      model: User,
      select: 'name image _id'
    })

    return replies;
    
  } catch (error: any) {
    throw new Error("Something went wrong in getActivity action", error.message);
  }
}