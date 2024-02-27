"use client";

import { ReactNode, useMemo, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Descendant, Text } from "slate";
import {
  Node,
  Replace,
  SlateView,
  createElementNodeMatcher,
  createElementTransform,
  createLeafNodeMatcher,
  createLeafTransform,
} from "slate-to-react";

import { Button } from "@/components/ui/button";

import Editor, { CustomText } from "@/components/editor";
import { createWrappedEditor } from "@/components/editor/editor-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface BodyFormProps {
  initialData: {
    bodyData: Descendant[];
  };
  postId: string;
}

const formSchema = z.object({
  bodyData: z.any(),
});

type Link = Replace<
  Node<"link">,
  {
    url: string;
    children: CustomText[];
  }
>;

type Paragraph = Replace<
  Node<"paragraph">,
  {
    children: CustomText[];
  }
>;

type HeadingOne = Replace<
  Node<"heading-one">,
  {
    children: CustomText[];
  }
>;

export const isLink = createElementNodeMatcher<Link>(
  (node): node is Link => node.type === "link" && typeof node.url === "string"
);

export const isParagraph = createElementNodeMatcher<Paragraph>(
  (node): node is Paragraph => node.type === "paragraph"
);

export const isHeadingOne = createElementNodeMatcher<HeadingOne>(
  (node): node is HeadingOne => node.type === "heading-one"
);

export const Anchor = createElementTransform(
  isLink,
  ({ key, element, attributes, children }) => (
    <a href={element.url} rel="noopener noreferrer" target="_blank" key={key}>
      {children}
    </a>
  )
);

export const Paragraph = createElementTransform(
  isParagraph,
  ({ key, element, attributes, children }) => <p key={key}>{children}</p>
);

export const HeadingOne = createElementTransform(
  isHeadingOne,
  ({ key, element, attributes, children }) => (
    <h1 className="text-3xl" key={key}>
      {children}
    </h1>
  )
);

export interface RichText extends Text {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  code?: boolean;
}

export const isRichText = createLeafNodeMatcher<RichText>(
  (node): node is RichText => {
    return typeof node.text === "string";
  }
);

export const RichText = createLeafTransform(
  isRichText,

  ({ key, attributes, leaf, children }) => {
    // Render <br /> for empty text blocks as it's probably just an empty line
    if (!children) {
      return <br />;
    }

    let element: ReactNode = children;

    if (leaf.bold) {
      element = <strong>{element}</strong>;
    }

    if (leaf.italic) {
      element = <i>{element}</i>;
    }

    if (leaf.underline) {
      element = <u>{element}</u>;
    }

    if (leaf.strikethrough) {
      element = <s>{element}</s>;
    }

    if (leaf.superscript) {
      element = <sup>{element}</sup>;
    } else if (leaf.subscript) {
      element = <sub>{element}</sub>;
    }

    if (leaf.code) {
      element = <code>{element}</code>;
    }
    return <span key={key}>{element}</span>;
  }
);

export const ContentForm = ({ initialData, postId }: BodyFormProps) => {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bodyData: initialData.bodyData || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Post updated");
      toggleEdit();
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between">
        Post body
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit body
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <SlateView
          nodes={initialData.bodyData}
          transforms={{ elements: [Paragraph, HeadingOne], leaves: [RichText] }}
        />
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="bodyData"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <Editor {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="flex items-center gap-x-2"
              disabled={!isValid || isSubmitting}
              type="submit"
            >
              Save
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};
