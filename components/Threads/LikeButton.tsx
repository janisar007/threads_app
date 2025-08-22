"use client";

import { likeThread, unlikeThread } from "@/lib/actions/like.actions";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosHeart, IoIosHeartEmpty } from "react-icons/io";
import { ring2 } from "ldrs";
import LikeUser from "./LikeUser";

export default function LikeButton({
  threadId,
  userId,
  isLikedByCurrentUser,
  likeCount,
  liked_users,
}: {
  threadId: string;
  userId: string;
  isLikedByCurrentUser: boolean;
  likeCount: number;
  liked_users: any;
}) {
  const pathname = usePathname();

  // Local states for optimistic UI
  const [liked, setLiked] = useState(isLikedByCurrentUser);
  const [count, setCount] = useState(likeCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ring2.register();
  }, []);

  async function handleLike() {
    // Optimistic update
    setLiked(true);
    setCount((prev) => prev + 1);

    try {
      setLoading(true);
      await likeThread({ threadId, userId, path: pathname });
    } catch (error) {
      console.log(error);
      // rollback on failure
      setLiked(false);
      setCount((prev) => prev - 1);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnLike() {
    // Optimistic update
    setLiked(false);
    setCount((prev) => Math.max(0, prev - 1));

    try {
      setLoading(true);
      await unlikeThread({ threadId, userId, path: pathname });
    } catch (error) {
      console.log(error);
      // rollback on failure
      setLiked(true);
      setCount((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="text-[1.3rem] flex flex-col items-center mt-[0.16rem]">
      {/* {loading && (
        <l-ring-2
          size="18"
          stroke="2"
          stroke-length="0.25"
          bg-opacity="0.1"
          speed="0.8"
          color="#5C5C7B"
        ></l-ring-2>
      )} */}

      { !liked ? (
        <IoIosHeartEmpty
          onClick={handleLike}
          className="cursor-pointer text-[#5C5C7B] hover:text-red-500"
        />
      ) :  liked ? (
        <IoIosHeart
          onClick={handleUnLike}
          className="text-red-500 cursor-pointer"
        />
      ) : null}

      <span className="text-[0.6rem] text-[#5C5C7B]">
        <LikeUser liked_users={liked_users} likeCount={count} />
      </span>
    </span>
  );
}
