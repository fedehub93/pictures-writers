"use client";

import { User } from "@/prisma/generated/client";

import { Actions } from "./actions";
import { MobileSidebar } from "../sidebar/mobile-sidebar";

export const Navbar = ({ user }: { user: User }) => {
  return (
    <div className="flex flex-none items-center gap-4 bg-background h-16 shadow-2xs dark:shadow-white p-4 md:px-8">
      <MobileSidebar />

      <nav className="hidden items-center space-x-4 md:flex lg:space-x-6">
        Overview
      </nav>
      <div className="ml-auto">
        <Actions user={user} />
      </div>
    </div>
  );
};
