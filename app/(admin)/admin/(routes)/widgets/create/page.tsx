"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  AppWindow,
  Box,
  Boxes,
  Captions,
  LucideIcon,
  NotebookPen,
  PanelRight,
  Search,
  Tags,
} from "lucide-react";

import { WidgetSection, WidgetType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  section: z.nativeEnum(WidgetSection),
  type: z.nativeEnum(WidgetType),
});

const sections = [
  {
    section: WidgetSection.HERO,
    label: "Hero section",
    Icon: Captions,
    types: [],
  },
  { section: WidgetSection.POPUP, label: "Pop-up", Icon: AppWindow, types: [] },
  {
    section: WidgetSection.POST_SIDEBAR,
    label: "Post Sidebar",
    Icon: PanelRight,
    types: [
      {
        type: WidgetType.SEARCH_BOX,
        label: "Search Box",
        Icon: Search,
      },
      {
        type: WidgetType.POST,
        label: "Posts",
        Icon: NotebookPen,
      },
      {
        type: WidgetType.CATEGORY,
        label: "Categories",
        Icon: Boxes,
      },
      {
        type: WidgetType.TAG,
        label: "Tags",
        Icon: Tags,
      },
      { type: WidgetType.PRODUCT, label: "Products", Icon: Box },
    ],
  },
];

const WidgetCreatePage = () => {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<WidgetSection | null>(
    null
  );
  const [selectedTypes, setSelectedTypes] = useState<
    { type: WidgetType; label: string; Icon: LucideIcon }[]
  >([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("/api/admin/widgets", values);
      router.push(`/admin/widgets/${response.data.id}`);

      toast.success("Widget created");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  useEffect(() => {
    const section = sections.find((s) => s.section === selectedSection);
    if (section) {
      setSelectedTypes(section.types);
    }
  }, [selectedSection]);

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your Widget</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your Widget? Don&apos;t worry, you can
          change this later.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. Search input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Widget Section</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        setSelectedSection(value as WidgetSection);
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-2"
                    >
                      {sections.map((section) => (
                        <FormItem key={section.section}>
                          <div>
                            <FormControl>
                              <RadioGroupItem
                                value={section.section}
                                id={section.section}
                                className="peer sr-only"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={section.section}
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <section.Icon className="w-6 h-6 mb-3" />
                              {section.label}
                            </FormLabel>
                          </div>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            {selectedTypes.length > 0 && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Widget Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-2"
                      >
                        {selectedTypes.map((type) => (
                          <FormItem key={type.type}>
                            <div>
                              <FormControl>
                                <RadioGroupItem
                                  value={type.type}
                                  id={type.type}
                                  className="peer sr-only"
                                />
                              </FormControl>
                              <FormLabel
                                htmlFor={type.type}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                              >
                                <type.Icon className="w-6 h-6 mb-3" />
                                {type.label}
                              </FormLabel>
                            </div>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <div className="flex items-center gap-x-2">
              <Link href="/admin/products">
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default WidgetCreatePage;
