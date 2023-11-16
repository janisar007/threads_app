import { fetchUser } from '@/lib/actions/user.actions';
import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import React from 'react'
import PostThread from '@/components/forms/PostThread';

export default async function page() {

    //First i want the user who want to create the thread->
    const user = await currentUser();

    if(!user) return null; //and parhaps clerk will redirect to login page.

    //here fetchUser is another action(backend route).
    const userInfo = await fetchUser(user.id);

    if(!userInfo?.onboarded) redirect('/onboarding');

  return (
    <>
        <h1 className="head-text">Create Threads</h1>

        <PostThread userId={userInfo._id} />
    </>
  )
}
