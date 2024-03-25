import Logo from "./logo";
import { Actions } from "./actions";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full h-20 z-[49] px-2 lg:px-4 bg-white flex justify-between items-center shadow-sm border-b border-b-zinc-300">
      <Logo />
      <Actions />
    </nav>
  );
};
