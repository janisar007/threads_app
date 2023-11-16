//!This layout file is for modifieing layout for the auth routes. like i do not want to show the navbar and footer for auth routes.

import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import '../globals.css';

//SEO->
export const metadata = {
  title: "Threads",
  desription: "A Next.js 13 Meta THreads Application",
};

const inter = Inter({ subsets: ["latin"] }); //inter jsut only store a goolge font name that is used in the body className.

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    // wrapping with clerk so that i can use its functioanlity throuout the auth routes.
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-dark-1`}>
          <div className="w-full flex justify-center items-center min-h-screen">{children}</div>
          </body>
      </html>
    </ClerkProvider>
  );
}
