"use client"; //coz we are using a hook

import React from "react";
import { sidebarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { SignedIn, SignOutButton, useAuth } from "@clerk/nextjs";

export default function LeftSidebar() {
  const router = useRouter(); //it will be used to direct user to another route. when we push any route into this it will be automatically directed to that route.

  //blow line will be used to know on which url we are on so that we can make that sidebar button look active. pathname contains the string form of the exact current path
  const pathname = usePathname();
  // console.log(router);
  // console.log(pathname);

  const { userId } = useAuth();
  
  console.log(userId);

  return (
    <section>
      <div className="custom-scrollbar leftsidebar">
        <div className="flex w-full flex-1 flex-col gap-6 px-6">
          {sidebarLinks.map((link) => {
            const isActive =
              (pathname.includes(link.route) && link.route.length > 1) ||
              pathname === link.route;

              if(link.route === '/profile') link.route = `${link.route}/${userId}`;

            return (
              <Link
                href={link.route}
                key={link.label}
                className={`leftsidebar_link ${isActive && "bg-primary-500"}`}
              >
                <Image
                  src={link.imgURL}
                  alt={link.label}
                  width={24}
                  height={24}
                />

                {/* max-lg:hidden means the name of the sidebar options will only show from the large and upper screens and will be hidden where the large screen ends*/}
                <p className="text-light-1 max-lg:hidden">{link.label}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 px-6">
          <SignedIn>
            <SignOutButton signOutCallback={() => router.push('/sign-in')}>
              <div className="flex cursor-pointer gap-4 p-4">
                <Image
                  src="/assets/logout.svg"
                  alt="logout"
                  width={24}
                  height={24}
                />

                <p className="text-light-2 max-lg:hidden">Logout</p>
              </div>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
