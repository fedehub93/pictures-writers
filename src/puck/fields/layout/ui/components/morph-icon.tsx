import type { LucideIcon, LucideProps } from "lucide-react";

import { cn } from "@/shared/lib/utils";

interface MorphIconProps extends LucideProps {
  IconRow: LucideIcon;
  IconCol: LucideIcon;
}

export const MorphIcon = ({
  IconRow,
  IconCol,
  className,
  ...rest
}: MorphIconProps) => {
  return (
    <div
      className={cn(
        `relative flex items-center justify-center size-4`,
        className ? ` ${className}` : "",
      )}
    >
      <IconRow
        {...rest}
        className={`absolute w-full h-full transition-all duration-300 ease-in-out opacity-100 rotate-0 scale-100 
          group-data-[direction=col]/flex:opacity-0 group-data-[direction=col]/flex:rotate-90 group-data-[direction=col]/flex:scale-50`}
      />
      <IconCol
        {...rest}
        className={`absolute w-full h-full transition-all duration-300 ease-in-out opacity-0 -rotate-90 scale-50 
          group-data-[direction=col]/flex:opacity-100 group-data-[direction=col]/flex:rotate-0 group-data-[direction=col]/flex:scale-100`}
      />
    </div>
  );
};
