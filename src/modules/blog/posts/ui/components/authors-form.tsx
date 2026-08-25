"use client";

import { CheckIcon, PlusCircleIcon } from "lucide-react";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { ContentStatus, User } from "@/generated/prisma";
import { Form } from "@/shared/ui/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { Field } from "@/shared/ui/field";

import { formatDate } from "@/lib/format";

import { useAuthorsQuery } from "@/app/(admin)/_hooks/use-authors-query";

import { postUpdateSchema, type PostUpdateValues } from "../../schemas";
import { usePostsFilters } from "../../hooks/use-posts-filters";

interface AuthorsFormProps {
  initialData: { status: ContentStatus; firstPublishedAt: Date } & {
    postAuthors: {
      user: User;
      sort: number;
    }[];
  };
  rootId: string;
  postId: string;
}

export const AuthorsForm = ({
  initialData,
  rootId,
  postId,
}: AuthorsFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();

  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    defaultValues: {
      authors:
        initialData?.postAuthors?.map((a) => ({
          id: a.user.id,
          sort: a.sort,
        })) ?? [],
    },
    mode: "onChange",
  });

  const {
    data: authors,
    isError: isAuthorError,
    isFetching,
  } = useAuthorsQuery();

  const { isSubmitting } = form.formState;

  const { mutate: updatePost, isPending } = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSelectAuthor = (a: { id: string; sort: number }) => {
    const current = form.getValues("authors") || [];
    const exists = current.some((v) => v.id === a.id);

    const newAuthors = exists
      ? current.filter((v) => v.id !== a.id)
      : [...current, a];

    form.setValue("authors", newAuthors, {
      shouldDirty: true,
      shouldTouch: true,
    });

    updatePost({
      id: postId,
      rootId: rootId,
      authors: newAuthors,
    });
  };

  const isLoadingSkeleton = isFetching && (!authors || authors.length === 0);

  if (isLoadingSkeleton) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <Skeleton className="w-full h-10" />
        </CardContent>
      </Card>
    );
  }

  if (!authors || isAuthorError) return <div>Error loading authors...</div>;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Authors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <Form {...form}>
          <form className="space-y-4 mt-4">
            <Controller
              control={form.control}
              name="authors"
              render={({ field }) => (
                <Field>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-dashed w-full mb-4 flex gap-x-2"
                          disabled={isSubmitting || isPending}
                        >
                          <PlusCircleIcon className="h-4 w-4" />
                          {field.value && field.value.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="rounded-sm px-1 font-normal"
                            >
                              {field.value.length} selected
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Search authors..." />
                          <CommandList>
                            <CommandEmpty>No authors found.</CommandEmpty>
                            <CommandGroup>
                              {authors.map((author) => (
                                <CommandItem
                                  key={author.id}
                                  value={`${author.firstName} ${author.lastName} ${author.id}`}
                                  onSelect={() => {
                                    onSelectAuthor({
                                      id: author.id,
                                      sort: field.value
                                        ? field.value.length
                                        : 0,
                                    });
                                  }}
                                  disabled={isSubmitting}
                                >
                                  <span className="mr-2">
                                    {author.firstName} {author.lastName}
                                  </span>
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto",
                                      field.value?.some(
                                        (v) => v.id === author.id,
                                      )
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Render degli autori selezionati (fuori dal popover ma dentro il field logic) */}
                    {field.value && field.value.length > 0 && (
                      <div className="hidden lg:flex flex-col gap-y-2">
                        {field.value.map((option) => {
                          const a = authors.find(
                            (auth) => auth.id === option.id,
                          );
                          if (!a) return null;
                          return (
                            <div
                              key={a.id}
                              className="flex gap-x-2 items-center bg-muted p-2 rounded-md"
                            >
                              {a.imageUrl ? (
                                <Image
                                  src={a.imageUrl}
                                  alt="thumbnail"
                                  height={40}
                                  width={40}
                                  className="size-10 object-cover grayscale rounded-full"
                                  unoptimized
                                />
                              ) : (
                                <div className="size-10 bg-gray-300 rounded-full shrink-0" />
                              )}
                              <span className="text-sm">
                                {a.firstName} {a.lastName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Field>
              )}
            />
          </form>
        </Form>
        <div className="text-xs text-muted-foreground">
          created At {formatDate({ date: initialData.firstPublishedAt })}
        </div>
      </CardContent>
    </Card>
  );
};
