import Link from "next/link";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Nav } from "./_components/nav";
import { MobileNavbar } from "./_components/mobile-navbar";

import { SearchBar } from "./_components/search-bar";

export const Navbar = async () => {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-b-gray-200">
      {/* <div className="flex gap-x-4 w-full px-4 items-center justify-center py-1 border-b bg-violet-100">
        Acquista ora il miglior libro sulla sceneggiatura cinematografica!
        <Button type="button" role="button">
          Prova
        </Button>
      </div> */}
      <div className="h-[80px] inset-y-0 w-full z-50 p-4  flex items-center shadow-2xs bg-white">
        <div className="w-full mx-auto flex justify-between md:max-w-6xl">
          <Link href="/" className="flex items-center gap-x-2">
            <Logo />
            <span className="text-base sm:text-lg uppercase font-bold block mt-1">
              Pictures Writers
            </span>
          </Link>
          <div className="hidden md:flex items-center">
            <Nav />
          </div>
          <div className="flex items-center gap-x-4">
            <Button asChild className="hidden md:block font-bold">
              <Link href="/feedback-gratuito-sceneggiatura" prefetch={true}>
                Feedback Gratuito
              </Link>
            </Button>
            <SearchBar />
            <MobileNavbar />
          </div>
        </div>
      </div>
    </header>
  );
};
