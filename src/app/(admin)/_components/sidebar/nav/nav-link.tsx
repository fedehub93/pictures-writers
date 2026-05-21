import Link from "next/link";

import { cn } from "@/lib/utils";
import { NavLinkProps } from "./types";
import { useCheckActiveNav } from "@/app/(admin)/_hooks/use-check-active-nav";

export const NavLink = ({
  title,
  icon: Icon,
  label,
  href,
  subLink,
}: NavLinkProps) => {
  const { checkActiveNav } = useCheckActiveNav();

  return (
    <Link
      href={href}
      className={cn(
        "h-12 justify-start text-wrap rounded-none px-6 flex items-center text-sm gap-3 w-full py-2 text-muted-foreground transition-all hover:text-accent-foreground hover:bg-accent",
        subLink && "h-10 w-full px-2",
        checkActiveNav(href) && "bg-accent text-accent-foreground"
      )}
    >
      {Icon && <Icon className="h-6 w-6 mr-2" strokeWidth={1.5} />}
      {title}
      {label && (
        <div className="ml-2 rounded-lg bg-primary px-1 text-primary-foreground">
          {label}
        </div>
      )}
    </Link>
  );
};
