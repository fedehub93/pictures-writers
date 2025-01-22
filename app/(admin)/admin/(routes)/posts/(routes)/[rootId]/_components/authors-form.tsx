"use client";

import Image from "next/image";
import * as z from "zod";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";

import { ContentStatus, Post, PostAuthor, User } from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthorsQuery } from "@/app/(admin)/_hooks/use-authors-query";

interface AuthorsFormProps {
  initialData: Post & {
    postAuthors: {
      user: User;
      sort: number;
    }[];
  };
  rootId: string;
  postId: string;
}

const formSchema = z.object({
  // authors: z.array(z.string().min(1)),
  authors: z.array(
    z.object({
      id: z.string().min(1),
      sort: z.coerce.number(),
    })
  ),
});

export const AuthorsForm = ({
  initialData,
  rootId,
  postId,
}: AuthorsFormProps) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: {
      authors: initialData.postAuthors
        ? [
            ...initialData.postAuthors.map((a) => ({
              id: a.user.id,
              sort: a.sort,
            })),
          ]
        : [],
    },
  });
  const { data: authors, isFetching, isError } = useAuthorsQuery();

  const { isSubmitting } = form.formState;

  const { field } = useController({
    control: form.control,
    name: "authors",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`/api/posts/${rootId}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`/api/posts/${rootId}/versions/${postId}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onSelectAuthor = (a: { id: string; sort: number }) => {
    let newAuthors = [...field.value];
    const author = field.value.find((v) => v.id === a.id);
    if (author) {
      newAuthors = [...field.value.filter((v) => v.id !== a.id)];
    }
    if (!author) {
      newAuthors.push(a);
    }
    field.onChange(newAuthors);
    form.handleSubmit(onSubmit)();
  };

  if (isFetching)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          {field.value.map((v) => (
            <Skeleton key={v.id} className="w-full h-[40px]" />
          ))}
        </CardContent>
      </Card>
    );
  if (!authors || isError) return <div>Error...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Post Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="authors"
              render={({ field }) => (
                <FormItem className="w-full flex flex-col">
                  <FormLabel>Authors</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-dashed w-full mb-4 flex gap-x-2"
                            disabled={isSubmitting}
                          >
                            <PlusCircle className="h-4 w-4" />
                            {field.value.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal"
                              >
                                {field.value.length} selected
                              </Badge>
                            )}
                          </Button>
                          {field.value.length > 0 && (
                            <div className="hidden lg:flex flex-col gap-y-2">
                              {field.value.map((option) => {
                                const a = authors.find(
                                  (a) => a.id === option.id
                                );
                                if (!a) return null;
                                return (
                                  <div
                                    key={a.id}
                                    className="flex gap-x-2 items-center bg-muted p-2 rounded-md"
                                  >
                                    <Image
                                      src={a.imageUrl!}
                                      alt="thumbnail"
                                      height={40}
                                      width={40}
                                      className="w-10 h-10 object-cover grayscale rounded-full"
                                    />
                                    <span className="text-sm">
                                      {a.firstName} {a.lastName}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {authors.map((author) => (
                              <CommandItem
                                value={author.id}
                                key={author.id}
                                onSelect={() => {
                                  // onSelectCategory(category.rootId!);
                                  onSelectAuthor({
                                    id: author.id,
                                    sort: field.value.length,
                                  });
                                  // fieldCategories.onChange(category.id);
                                }}
                                disabled={isSubmitting}
                              >
                                <span className="mr-2">
                                  {author.firstName} {author.lastName}
                                </span>
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    field.value.find((v) => v.id === author.id!)
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

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <div className="text-sm text-muted-foreground">
          created At {formatDate({ date: initialData.firstPublishedAt })}
        </div>
      </CardContent>
    </Card>
  );
};
