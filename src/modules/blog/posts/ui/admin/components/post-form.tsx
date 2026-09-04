"use client";

import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { parse, set } from "date-fns";

import { useTRPC } from "@/trpc/client";

import { Form, FormMessage } from "@/shared/ui/form";

import { Button } from "@/shared/ui/button";

import { generateSlug } from "@/shared/lib/slug";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { SlugInput } from "@/shared/components/form-component/slug-input";
import { ScheduleDatePicker } from "@/shared/components/schedule-date-picker";

import { postInsertSchema, type PostInsertValues } from "../../../schemas";

import { usePostsFilters } from "../../../hooks/use-posts-filters";

interface PostFormProps {
  data?: Partial<{ scheduledAt: Date | null }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PostForm = ({ data, onSuccess, onCancel }: PostFormProps) => {
  const [date, setDate] = useState<Date | undefined>(
    data?.scheduledAt ?? undefined,
  );
  const [time, setTime] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = usePostsFilters();

  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const form = useForm<PostInsertValues>({
    resolver: zodResolver(postInsertSchema),
    defaultValues: {
      title: "",
      slug: "",
      scheduledAt: null,
    },
  });

  const createPost = useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.posts.getMany.queryOptions(filters),
        );
        toast.success("Post created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createPost.isPending;

  const onSubmit = (values: PostInsertValues) => {
    let scheduledAt: Date | null = null;
    if (date) {
      const parsedTime = parse(time, "h:mm a", new Date());
      if (!Number.isNaN(parsedTime.getTime())) {
        scheduledAt = set(date, {
          hours: parsedTime.getHours(),
          minutes: parsedTime.getMinutes(),
          seconds: 0,
          milliseconds: 0,
        });
      }
    }
    createPost.mutate({ ...values, scheduledAt, timezone: timeZone });
  };

  const { field: fieldTitle } = useController({
    control: form.control,
    name: "title",
  });
  const { field: fieldSlug } = useController({
    control: form.control,
    name: "slug",
  });

  const onSlugCreate = () => {
    fieldSlug.onChange(generateSlug(fieldTitle.value));
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          onBlur={() => {
            onSlugCreate();
          }}
          name="title"
          label="Title"
          placeholder="About Us"
          disabled={isPending}
        />
        <SlugInput
          control={form.control}
          name="slug"
          label="Slug"
          placeholder="about-us"
          disabled={isPending}
          buttonOnClick={onSlugCreate}
        />
        {data?.scheduledAt && (
          <ScheduleDatePicker
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            align="center"
            
          />
        )}

        <div className="flex justify-between gap-x-2 mt-8">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Cancel
              <FormMessage />
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
};
