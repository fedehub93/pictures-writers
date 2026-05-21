import { cn } from "@/lib/utils";
import Link from "next/link";

import { NavLinkProps } from "./types";
import { useCheckActiveNav } from "@/app/(admin)/_hooks/use-check-active-nav";

export const NavLinkIcon = ({
  title,
  icon: Icon,
  label,
  href,
}: NavLinkProps) => {
  const { checkActiveNav } = useCheckActiveNav();

  return (
    <Link
      href={href}
      className={cn(
        "h-12 w-full px-3 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        checkActiveNav(href) && "bg-accent text-accent-foreground"
      )}
    >
      {Icon && <Icon className="h-6 w-6" strokeWidth={1.5} />}
      <span className="sr-only">{title}</span>
    </Link>
  );
};
