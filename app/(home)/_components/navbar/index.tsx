import Link from "next/link";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Nav } from "./_components/nav";
import { MobileNavbar } from "./_components/mobile-navbar";

export const Navbar = async () => {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-b-gray-200">
      <div className="block sm:hidden self-center whitespace-nowrap border-b bg-violet-100 text-center text-sm font-extrabold uppercase text-black md:text-2xl">
        Pictures Writers
      </div>
      <div className="h-[80px] inset-y-0 w-full z-50 p-4  flex items-center shadow-sm bg-white">
        <div className="w-full mx-auto flex justify-between md:max-w-6xl">
          <Link href="/" className="flex items-center gap-x-2">
            <Logo />
            <span className="text-lg uppercase font-bold hidden sm:block mt-1">
              Pictures Writers
            </span>
          </Link>
          <div className="hidden md:flex items-center">
            <Nav />
          </div>
          <div className="flex items-center gap-x-4">
            <Button asChild className="font-bold">
              <Link href="/feedback-gratuito-sceneggiatura" prefetch={true}>
                Feedback Gratuito
              </Link>
            </Button>
            <MobileNavbar />
          </div>
        </div>
      </div>
    </header>
  );
};
