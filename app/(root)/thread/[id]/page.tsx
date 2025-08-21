import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";
import { fetchThreadById } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const page = async ({ params }: { params: { id: string } }) => {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const thread: any = await fetchThreadById(params.id, userInfo._id);

  // console.log("ThreadPosts", thread);

  return (
    <section className="relative">
      <div>
        <ThreadCard
          key={thread._id}
          id={thread._id}
          userId={userInfo._id}
          currentUserId={user?.id || ""}
          parentId={thread.parentId}
          content={thread.text}
          author={thread.author}
          community={thread.community}
          createdAt={thread.createdAt}
          comments={thread.children}
          likeCount={thread.likeCount}
          isLikedByCurrentUser={thread.isLikedByCurrentUser}
        />
      </div>
      <div className="mt-7">
        <Comment
          threadId={thread._id}
          currentUserImg={userInfo.image}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {thread?.children.map((childItem: any) => (
          <ThreadCard
            key={childItem._id}
            id={childItem._id}
            userId={userInfo._id}
            currentUserId={user?.id || ""}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            isComment
            likeCount={childItem.likeCount}
            isLikedByCurrentUser={childItem.isLikedByCurrentUser}
          />
        ))}{" "}
        {/*isComment is a boolean value set to true*/}
      </div>
    </section>
  );
};

export default page;
