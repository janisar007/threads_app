"use client"; //coz we are using a hook

import React from "react";
import { sidebarLinks } from "@/constants";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { SignedIn, SignOutButton } from "@clerk/nextjs";
export default function Bottombar() {
  const router = useRouter(); //it will be used to direct user to another route. when we push any route into this it will be automatically directed to that route.

  //blow line will be used to know on which url we are on so that we can make that sidebar button look active. pathname contains the string form of the exact current path
  const pathname = usePathname();
  return (
    <section className='bottombar'>
      <div className="bottombar_container">
      {sidebarLinks.map((link) => {
            const isActive =
              (pathname.includes(link.route) && link.route.length > 1) ||
              pathname === link.route;

            return (
              <Link
                href={link.route}
                key={link.label}
                className={`bottombar_link ${isActive && "bg-primary-500"}`}
              >
                <Image
                  src={link.imgURL}
                  alt={link.label}
                  width={24}
                  height={24}
                />

                {/* max-lg:hidden means the name of the sidebar options will only show from the large and upper screens and will be hidden where the large screen ends*/}
                <p className="text-subtle-medium text-light-1 max-sm:hidden">{link.label.split(/\s+/)[0]}</p>
                {/* link.label.split(/\s+/)[0] is for to only get the first word of the label. */}
              </Link>
            );
          })}
      </div>
      
    </section>
  )
}
