import ThreadCard from "@/components/cards/ThreadCard";
import { fetchPosts } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs";

export default async function Home() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  const result: any = await fetchPosts(1, 30, userInfo._id);
  console.log("result", result);

  return (
    <div>
      <>
        <h1 className="head-text text-left">Home</h1>

        <section className="mt-9 flex flex-col gap-10">
          {result.posts.length === 0 ? (
            <p className="no-result">No threads found</p>
          ) : (
            <>
              {result.posts.map((post: any) => (
                <ThreadCard
                  key={post._id}
                  id={post._id}
                  userId={userInfo._id}
                  currentUserId={user?.id || ""}
                  parentId={post.parentId}
                  content={post.text}
                  author={post.author}
                  community={post.community}
                  createdAt={post.createdAt}
                  comments={post.children}
                  likeCount={post.likeCount}
                  isLikedByCurrentUser={post.isLikedByCurrentUser}
                />
              ))}
            </>
          )}
        </section>
      </>
    </div>
  );
}
