import Image from "next/image";
import { Check, PlusCircle } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import { ContentStatus } from "@prisma/client";

interface MultiSelectV2Props {
  label: string;
  isSubmitting: boolean;
  values: { id: string; sort: number }[];
  options: {
    id: string;
    label: string;
    status?: ContentStatus;
    imageUrl?: string;
  }[];
  onSelectValue: ({ id, sort }: { id: string; sort: number }) => void;
  showValuesInButton?: boolean;
  showValues?: boolean;
}

export const MultiSelectV2 = ({
  label,
  isSubmitting,
  values,
  options,
  onSelectValue,
  showValuesInButton = false,
  showValues = false,
}: MultiSelectV2Props) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <div className="flex flex-col space-y-4">
            <Button
              type="button"
              variant="outline"
              className="border-dashed w-full flex gap-x-2 justify-start"
              disabled={isSubmitting}
            >
              <PlusCircle className="h-4 w-4" />
              {showValuesInButton && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    {values.length}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    {values.length > 8 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {values.length} selected
                      </Badge>
                    ) : (
                      options
                        .filter((option) =>
                          values.find((v) => v.id === option.id)
                        )
                        .map((option) => (
                          <Badge
                            variant="secondary"
                            key={option.id}
                            className={cn(
                              "rounded-sm px-1 text-white font-semibold",
                              option?.status === ContentStatus.DRAFT &&
                                "bg-slate-700",
                              option?.status === ContentStatus.CHANGED &&
                                "bg-sky-700",
                              option?.status === ContentStatus.PUBLISHED &&
                                "bg-emerald-700"
                            )}
                          >
                            {option.label}
                          </Badge>
                        ))
                    )}
                  </div>
                </>
              )}
            </Button>
            {showValues && values.length > 0 && (
              <div className="hidden lg:flex flex-col gap-y-2">
                {values.map((option) => {
                  const o = options.find((o) => o.id === option.id);
                  if (!o) return null;
                  return (
                    <div
                      key={o.id}
                      className="flex gap-x-2 items-center bg-muted p-2 rounded-md"
                    >
                      {o.imageUrl && (
                        <Image
                          src={o.imageUrl!}
                          alt="thumbnail"
                          height={40}
                          width={40}
                          className="w-10 h-10 object-cover grayscale rounded-full"
                          unoptimized
                        />
                      )}
                      <span className="text-sm">{o.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command
          filter={(value, search) => {
            const isFound = options.find(
              (o) =>
                o.id === value &&
                o.label.toLowerCase().includes(search.toLowerCase())
            );
            if (isFound) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder={`Search ${label}...`} />
          <CommandList>
            <CommandEmpty>No {label} found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  value={o.id}
                  key={o.id}
                  onSelect={() => {
                    onSelectValue({
                      id: o.id,
                      sort: values.length,
                    });
                  }}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">{o.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.find((v) => v.id === o.id!)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
