import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";

import { NavLinkProps } from "./types";
import { NavLink } from "./nav-link";
import { useCheckActiveNav } from "@/app/(admin)/_hooks/use-check-active-nav";

export const NavLinkDropdown = ({
  title,
  icon: Icon,
  label,
  sub,
}: NavLinkProps) => {
  const { checkActiveNav } = useCheckActiveNav();
  const isChildActive = !!sub?.find((link) => checkActiveNav(link.href));

  return (
    <Collapsible defaultOpen={isChildActive}>
      <CollapsibleTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "group h-12 w-full justify-start rounded-none px-6 font-normal text-muted-foreground flex items-center gap-3",
            isChildActive && "bg-accent text-accent-foreground"
          )}
        >
          {Icon && <Icon className="h-6 w-6 mr-2" strokeWidth={1.5} />}
          {title}
          {label && (
            <div className="ml-2 rounded-lg bg-primary px-1 text-[0.625rem] text-primary-foreground">
              {label}
            </div>
          )}
          <span
            className={cn(
              'ml-auto transition-all group-data-[state="open"]:-rotate-180'
            )}
          >
            <ChevronDown strokeWidth={1} />
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="collapsibleDropdown" asChild>
        <ul>
          {sub!.map((sublink) => (
            <li key={sublink.title} className="my-1 ml-8">
              <NavLink {...sublink} subLink />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};
