import Image from "next/image";
import { Check, PlusCircle } from "lucide-react";

import { ContentStatus } from "@prisma/client";
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

interface MultiSelectSimpleProps {
  label: string;
  isSubmitting?: boolean;
  values: string[]; // 👈 solo array di stringhe
  options: {
    id: string;
    label: string;
    status?: ContentStatus;
    imageUrl?: string;
  }[];
  onChange: (newValues: string[]) => void; // 👈 callback unica
  showValuesInButton?: boolean;
  showValues?: boolean;
}

export const MultiSelectSimple = ({
  label,
  isSubmitting = false,
  values,
  options,
  onChange,
  showValuesInButton = false,
  showValues = false,
}: MultiSelectSimpleProps) => {
  const handleToggle = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <div className="flex flex-col space-y-4 w-full">
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
                  {values.length === 0 && <div>Select {label}</div>}
                  {values.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal lg:hidden"
                    >
                      {values.length} {label} selected
                    </Badge>
                  )}
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
                        .filter((option) => values.includes(option.id))
                        .map((option) => (
                          <Badge
                            variant="secondary"
                            key={option.id}
                            className={cn(
                              "rounded-sm px-1 text-white font-semibold bg-primary",
                              option?.status === ContentStatus.DRAFT &&
                                "bg-slate-700 hover:bg-slate-700/60",
                              option?.status === ContentStatus.CHANGED &&
                                "bg-sky-700 hover:bg-sky-700/60",
                              option?.status === ContentStatus.PUBLISHED &&
                                "bg-emerald-700 hover:bg-emerald-700/60"
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
                {values.map((id) => {
                  const o = options.find((opt) => opt.id === id);
                  if (!o) return null;
                  return (
                    <div
                      key={o.id}
                      className="flex gap-x-2 items-center bg-muted p-2 rounded-md"
                    >
                      {o.imageUrl && (
                        <Image
                          src={o.imageUrl}
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
            return isFound ? 1 : 0;
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
                  onSelect={() => handleToggle(o.id)}
                  disabled={isSubmitting}
                >
                  <span className="mr-2">{o.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      values.includes(o.id) ? "opacity-100" : "opacity-0"
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
