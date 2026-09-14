"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileIcon, History, UserRound } from "lucide-react";
import Image from "next/image";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DialogFooter } from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { FileUpload } from "@/shared/components/file-upload";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import { SidebarDialog } from "@/shared/components/sidebar-dialog";
import { Separator } from "@/shared/ui/separator";

type User = inferRouterOutputs<AppRouter>["users"]["getMany"]["users"][number];

type Activity = {
  id: string;
  action: string;
  area: string;
  outcome: string;
  createdAt: Date;
  actor: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  imageUrl: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  roles: { id: string; name: string }[];
  activities: Activity[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (value: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    imageUrl: string | null;
    roleId: string;
  }) => void;
}

const fullName = (user: User) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name;

const NAV_ITEMS = [
  { key: "general" as const, label: "General", icon: UserRound },
  { key: "activity" as const, label: "Activity history", icon: History },
];

export function EditUserDialog({
  open,
  user,
  roles,
  activities,
  pending,
  onClose,
  onSubmit,
}: EditUserDialogProps) {
  const [section, setSection] = useState<"general" | "activity">("general");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      bio: "",
      imageUrl: "",
      roleId: "",
    },
  });

  const imageUrl = form.watch("imageUrl");

  const isRoleLocked = user?.roleDefinition?.key === "ADMIN";

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        bio: user.bio ?? "",
        imageUrl: user.imageUrl ?? "",
        roleId: user.roleDefinition?.id ?? "",
      });
    }
  }, [user, open, form]);

  const handleSubmit = (values: FormValues) => {
    if (!user) return;
    onSubmit({
      id: user.id,
      firstName: values.firstName || null,
      lastName: values.lastName || null,
      bio: values.bio || null,
      imageUrl: values.imageUrl || null,
      roleId: values.roleId,
    });
  };

  return (
    <SidebarDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Edit user"
      description="Keep the profile details up to date."
    >
      <div className="flex max-h-[90dvh] flex-col overflow-hidden sm:h-144 sm:max-h-[90dvh] sm:flex-row">
        <aside className="w-full shrink-0 flex-col bg-muted/40 sm:w-60 sm:border-r hidden sm:flex">
            <div className="flex items-center gap-3 border-b p-4 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
              {imageUrl && !imageUrl.endsWith(".pdf") ? (
                <div className="relative size-16 overflow-hidden rounded-full">
                  <Image
                    fill
                    src={imageUrl}
                    alt="User"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <FileIcon className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="text-sm font-medium leading-tight">
                {user ? fullName(user) : ""}
              </div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <nav className="flex flex-row gap-1 p-3 sm:flex-col">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSection(key)}
                  className={
                    section === key
                      ? "flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-left text-sm font-medium text-accent-foreground sm:flex-none sm:justify-start"
                      : "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground sm:flex-none sm:justify-start"
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="flex flex-1 flex-col overflow-hidden">
            <div className="items-center justify-between border-b px-6 py-4 hidden sm:block">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Edit user
                </h2>
                <p className="text-muted-foreground">
                  Keep the profile details up to date.
                </p>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {section === "general" ? (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4">
                        <h3 className="-mb-2 font-medium">Profile</h3>
                        <Separator />
                      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <FileUpload
                                  endpoint="userImage"
                                  value={field.value}
                                  onChange={({ url }) => field.onChange(url)}
                                  size="small"
                                  className="rounded-full size-36!"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="grid flex-1 gap-4 w-full">
                          <GenericInput
                            control={form.control}
                            name="firstName"
                            label="First Name"
                            placeholder="Enter first name"
                          />
                          <GenericInput
                            control={form.control}
                            name="lastName"
                            label="Last Name"
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h3 className="-mb-2 font-medium">Account</h3>
                      <Separator />
                      <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel>Role</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isRoleLocked}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {isRoleLocked && (
                              <FormDescription>
                                The admin role cannot be changed.
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium">Activity history</h3>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>When</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Outcome</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              {activity.createdAt.toLocaleString()}
                            </TableCell>
                            <TableCell>{activity.action}</TableCell>
                            <TableCell>{activity.area}</TableCell>
                            <TableCell>
                              {[
                                activity.actor?.firstName,
                                activity.actor?.lastName,
                              ]
                                .filter(Boolean)
                                .join(" ") ||
                                activity.actor?.name ||
                                activity.actor?.email ||
                                "System"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  activity.outcome === "SUCCESS"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {activity.outcome}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!activities.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No activity recorded.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
                </div>

                <DialogFooter className="border-t px-6 py-4 flex flex-row gap-4 w-full justify-between">
                  <Button variant="outline" onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button disabled={pending} type="submit">
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </section>
        </div>
      </SidebarDialog>
  );
}
