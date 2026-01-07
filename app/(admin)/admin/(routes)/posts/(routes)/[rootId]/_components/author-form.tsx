"use client";

import Image from "next/image";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useDebounceCallback } from "usehooks-ts";

import { ContentStatus, Post, User } from "@/prisma/generated/client";
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

interface AuthorFormProps {
  initialData: Post;
  rootId: string;
  postId: string;
  authors: User[];
}

const formSchema = z.object({
  userId: z.string().min(1),
});

export const AuthorForm = ({
  initialData,
  rootId,
  postId,
  authors,
}: AuthorFormProps) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    mode: "all",
    resolver: zodResolver(formSchema),
    defaultValues: { userId: initialData.userId || "" },
  });

  const { isValid, isSubmitting, touchedFields } = form.formState;

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

  const onChangeAuthor = (value: string) => {
    form.setValue("userId", value);
    form.trigger("userId");
    // setSelectedOptions(options.find((options) => options.value === value));
    debouncedSubmit();
  };

  const debouncedSubmit = useDebounceCallback(() => {
    form.handleSubmit(onSubmit)();
  }, 5000);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Post Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel className="block">Author</FormLabel>
                  <Select
                    onValueChange={onChangeAuthor}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an author..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {authors?.map((author) => (
                        <SelectItem key={author.id} value={author.id}>
                          <div className="flex gap-x-4 items-center">
                            {author.imageUrl && (
                              <Image
                                src={author.imageUrl}
                                alt="Author image"
                                className="rounded-full"
                                width="32"
                                height="32"
                                unoptimized
                              />
                            )}
                            {author.firstName} {author.lastName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
