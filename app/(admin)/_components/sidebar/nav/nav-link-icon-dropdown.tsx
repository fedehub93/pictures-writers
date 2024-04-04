import { NavLinkProps } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCheckActiveNav } from "@/app/(admin)/_hooks/use-check-active-nav";
import { cn } from "@/lib/utils";

export const NavLinkIconDropdown = ({
  title,
  icon: Icon,
  label,
  sub,
}: NavLinkProps) => {
  const { checkActiveNav } = useCheckActiveNav();
  const isChildActive = !!sub?.find((s) => checkActiveNav(s.href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-full px-3 flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            isChildActive && "bg-accent text-accent-foreground"
          )}
        >
          {Icon && <Icon className="h-6 w-6" strokeWidth={1.5} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={4}>
        <DropdownMenuLabel>
          {title} {label ? `(${label})` : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sub!.map(({ title, icon: Icon, label, href }) => (
          <DropdownMenuItem key={`${title}-${href}`} asChild>
            <Link
              href={href}
              className={cn(
                "text-muted-foreground",
                checkActiveNav(href) && "bg-accent text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-6 w-6" strokeWidth={1.5} />}{" "}
              <span className="ml-2 max-w-52 text-wrap">{title}</span>
              {label && <span className="ml-auto text-xs">{label}</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
