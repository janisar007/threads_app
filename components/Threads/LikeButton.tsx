// Client component
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

  const [likeLoading, setLikeLoading] = useState<any>(false);
  useEffect(() => {
    ring2.register(); // 👈 register the <l-ring-2> element
  }, []);

  async function handleLike() {
    try {
      setLikeLoading(true);

      await likeThread({ threadId, userId, path: pathname }); // 👈 pass pathname
    } catch (error) {
      console.log(error);
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleUnLike() {
    try {
      setLikeLoading(true);

      await unlikeThread({ threadId, userId, path: pathname }); // 👈 pass pathname
    } catch (error) {
      console.log(error);
    } finally {
      setLikeLoading(false);
    }
  }

  return (
    <span className="text-[1.3rem] flex flex-col items-center mt-[0.16rem]">
      {likeLoading ? (
        <l-ring-2
          size="18"
          stroke="2"
          stroke-length="0.25"
          bg-opacity="0.1"
          speed="0.8"
          color="#5C5C7B"
        ></l-ring-2>
      ) : !isLikedByCurrentUser ? (
        <IoIosHeartEmpty
          onClick={handleLike}
          className=" cursor-pointer text-[#5C5C7B] hover:text-red-500"
        />
      ) : (
        <IoIosHeart
          onClick={handleUnLike}
          className="text-red-500 cursor-pointer"
        />
      )}
      <span className="text-[0.6rem] text-[#5C5C7B]">
        <LikeUser liked_users={liked_users} likeCount={likeCount} />
      </span>
    </span>
  );
}
