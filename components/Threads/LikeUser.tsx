"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

const LikeUser = ({
  likeCount,
  liked_users
}: {
  likeCount: number;
  liked_users: any;
}) => {


  return (
    <Dialog >
      <DialogTrigger>{likeCount}</DialogTrigger>
      <DialogContent className="bg-[#121417] border-none outline-none">
        <DialogHeader>
          <DialogTitle className="text-white mb-6">Liked by</DialogTitle>
          <DialogDescription >
            <div className="flex flex-col gap-6">
                {liked_users?.length === 0 ?<span>No like</span> : liked_users?.map((user:any) => {

                    return <div className="flex items-start gap-3">
                        <Image
                            src={user.image}
                            alt={'image'}
                            width={24}
                            height={24}
                            className="object-contain rounded-full"
                        />
                        <div className="flex flex-col">
                            <div className=" text-white">{user.username}</div>
                            <div className="">{user.bio}</div>
                        </div>
                    </div>

                })}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default LikeUser;
