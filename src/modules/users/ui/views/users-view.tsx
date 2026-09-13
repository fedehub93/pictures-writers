"use client";

import "client-only";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Pencil, RotateCw, Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

type User = inferRouterOutputs<AppRouter>["users"]["getMany"]["users"][number];

const getFilters = (params: URLSearchParams) => ({
  search: params.get("search") ?? "",
  roleId: params.get("roleId") ?? undefined,
  accountStatus: (params.get("status") as "ACTIVE" | "SUSPENDED" | null) ?? undefined,
  page: Math.max(1, Number(params.get("page") ?? 1)),
  pageSize: 20,
  sort: (params.get("sort") as "name" | "email" | "createdAt" | "accountStatus" | null) ?? "createdAt",
  direction: (params.get("direction") as "asc" | "desc" | null) ?? "desc",
});

export function UsersView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const trpc = useTRPC();
  const canManage = usePermission(PERMISSIONS.USERS_MANAGE);
  const queryClient = useQueryClient();
  const filters = getFilters(params);
  const query = useQuery(trpc.users.getMany.queryOptions(filters));
  const invitations = useQuery(trpc.users.getInvitations.queryOptions());
  const [editing, setEditing] = useState<User | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const activities = useQuery(trpc.users.getActivityHistory.queryOptions({ userId: editing?.id ?? "00000000-0000-0000-0000-000000000000" }, { enabled: Boolean(editing) }));
  const update = useMutation(trpc.users.update.mutationOptions({
    onSuccess: () => { toast.success("User updated"); setEditing(null); void queryClient.invalidateQueries({ queryKey: trpc.users.getMany.queryKey() }); },
    onError: (error) => toast.error(error.message),
  }));
  const status = useMutation(trpc.users.updateStatus.mutationOptions({
    onSuccess: () => { toast.success("Account status updated"); void queryClient.invalidateQueries({ queryKey: trpc.users.getMany.queryKey() }); },
    onError: (error) => toast.error(error.message),
  }));
  const createInvitation = useMutation(trpc.users.createInvitation.mutationOptions({ onSuccess: () => { toast.success("Invitation sent"); setInviteOpen(false); void invitations.refetch(); }, onError: (error) => toast.error(error.message) }));
  const resendInvitation = useMutation(trpc.users.resendInvitation.mutationOptions({ onSuccess: () => { toast.success("Invitation resent"); void invitations.refetch(); }, onError: (error) => toast.error(error.message) }));
  const cancelInvitation = useMutation(trpc.users.cancelInvitation.mutationOptions({ onSuccess: () => { toast.success("Invitation cancelled"); void invitations.refetch(); }, onError: (error) => toast.error(error.message) }));
  const requestReset = useMutation(trpc.users.requestPasswordReset.mutationOptions({ onSuccess: () => toast.success("Password reset email sent"), onError: (error) => toast.error(error.message) }));
  const setFilters = (values: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key); });
    if (!("page" in values)) next.delete("page");
    router.replace(`${pathname}?${next.toString()}` as Route);
  };
  const users = query.data?.users ?? [];
  const roles = query.data?.roles ?? [];
  const page = query.data?.page ?? 1;
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));

  return (
    <div className="flex h-full w-full flex-col gap-4 px-6 py-3">
       <div className="flex items-center justify-between"><ContentHeader label="Users" totalEntries={query.data?.total ?? 0} />{canManage && <Button onClick={() => setInviteOpen(true)}><UserPlus data-icon="inline-start" />Invite user</Button>}</div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-64 pl-9" placeholder="Search name or email" defaultValue={filters.search} onKeyDown={(event) => { if (event.key === "Enter") setFilters({ search: event.currentTarget.value }); }} /></div>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.roleId ?? ""} onChange={(event) => setFilters({ roleId: event.target.value })}><option value="">All roles</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={filters.accountStatus ?? ""} onChange={(event) => setFilters({ status: event.target.value })}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={`${filters.sort}:${filters.direction}`} onChange={(event) => { const [sort, direction] = event.target.value.split(":"); setFilters({ sort, direction }); }}><option value="createdAt:desc">Newest</option><option value="name:asc">Name</option><option value="email:asc">Email</option><option value="accountStatus:asc">Status</option></select>
      </div>
       <div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th>{canManage && <th className="p-3 text-right">Actions</th>}</tr></thead><tbody>{users.map((user) => <UserRow key={user.id} user={user} canManage={canManage} onEdit={() => setEditing(user)} onStatus={() => { if (window.confirm(`${user.accountStatus === "ACTIVE" ? "Suspend" : "Reactivate"} this account?`)) status.mutate({ id: user.id, accountStatus: user.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }); }} onReset={() => requestReset.mutate({ email: user.email ?? "" })} />)}{!users.length && <tr><td className="p-8 text-center" colSpan={canManage ? 5 : 4}>No users found.</td></tr>}</tbody></table></div>
       <section className="flex flex-col gap-3"><h2 className="text-lg font-semibold">Invitations</h2><div className="overflow-x-auto rounded-md border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{(invitations.data ?? []).map((invitation) => <tr className="border-b last:border-0" key={invitation.id}><td className="p-3">{invitation.email}</td><td className="p-3">{invitation.role.name}</td><td className="p-3"><Badge variant={invitation.status === "PENDING" ? "default" : "secondary"}>{invitation.status}</Badge></td><td className="p-3 text-right">{invitation.status === "PENDING" && <><Button variant="ghost" size="sm" onClick={() => resendInvitation.mutate({ id: invitation.id })}><RotateCw data-icon="inline-start" />Resend</Button><Button variant="ghost" size="sm" onClick={() => cancelInvitation.mutate({ id: invitation.id })}><X data-icon="inline-start" />Cancel</Button></>}</td></tr>)}{!invitations.data?.length && <tr><td className="p-8 text-center" colSpan={4}>No invitations found.</td></tr>}</tbody></table></div></section>
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setFilters({ page: String(page - 1) })}>Previous</Button><span className="px-2 py-2 text-sm">Page {page} of {totalPages}</span><Button variant="outline" disabled={page >= totalPages} onClick={() => setFilters({ page: String(page + 1) })}>Next</Button></div>
        <EditDialog key={editing?.id ?? "closed"} user={editing} roles={roles} activities={activities.data ?? []} pending={update.isPending} onClose={() => setEditing(null)} onSubmit={(value) => update.mutate(value)} />
       <InviteDialog open={inviteOpen} roles={roles} pending={createInvitation.isPending} onClose={() => setInviteOpen(false)} onSubmit={(value) => createInvitation.mutate(value)} />
    </div>
  );
}

function UserRow({ user, canManage, onEdit, onStatus, onReset }: { user: User; canManage: boolean; onEdit: () => void; onStatus: () => void; onReset: () => void }) {
  return <tr className="border-b last:border-0"><td className="p-3">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "Unnamed"}</td><td className="p-3">{user.email ?? "-"}</td><td className="p-3">{user.roleDefinition?.name ?? "-"}</td><td className="p-3"><Badge variant={user.accountStatus === "ACTIVE" ? "default" : "secondary"}>{user.accountStatus}</Badge></td>{canManage && <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={onEdit}><Pencil data-icon="inline-start" />Edit</Button><Button variant="ghost" size="sm" onClick={onReset}><Mail data-icon="inline-start" />Reset password</Button><Button variant="ghost" size="sm" onClick={onStatus}>{user.accountStatus === "ACTIVE" ? "Suspend" : "Reactivate"}</Button></td>}</tr>;
}

function InviteDialog({ open, roles, pending, onClose, onSubmit }: { open: boolean; roles: { id: string; name: string }[]; pending: boolean; onClose: () => void; onSubmit: (value: { email: string; roleId: string }) => void }) {
  const [email, setEmail] = useState(""); const [roleId, setRoleId] = useState("");
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Invite user</DialogTitle></DialogHeader><div className="flex flex-col gap-3"><Input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" /><select className="h-10 rounded-md border bg-background px-3 text-sm" value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="">Select a role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={pending || !email || !roleId} onClick={() => onSubmit({ email, roleId })}>Send invitation</Button></DialogFooter></DialogContent></Dialog>;
}

function EditDialog({ user, roles, activities, pending, onClose, onSubmit }: { user: User | null; roles: { id: string; name: string }[]; activities: Array<{ id: string; action: string; area: string; outcome: string; createdAt: Date; actor: { name: string | null; firstName: string | null; lastName: string | null; email: string | null } | null }>; pending: boolean; onClose: () => void; onSubmit: (value: { id: string; firstName: string | null; lastName: string | null; bio: string | null; imageUrl: string | null; roleId: string }) => void }) {
  const [firstName, setFirstName] = useState(user?.firstName ?? ""); const [lastName, setLastName] = useState(user?.lastName ?? ""); const [bio, setBio] = useState(user?.bio ?? ""); const [imageUrl, setImageUrl] = useState(user?.imageUrl ?? ""); const [roleId, setRoleId] = useState(user?.roleDefinition?.id ?? "");
  const open = Boolean(user);
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader><div className="grid gap-3"><Input aria-label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" /><Input aria-label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" /><Textarea aria-label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Bio" /><Input aria-label="Profile image URL" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Profile image URL" /><select className="h-10 rounded-md border bg-background px-3 text-sm" value={roleId} onChange={(event) => setRoleId(event.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div><section className="flex flex-col gap-2"><h3 className="font-semibold">Activity history</h3><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>When</TableHead><TableHead>Action</TableHead><TableHead>Area</TableHead><TableHead>Actor</TableHead><TableHead>Outcome</TableHead></TableRow></TableHeader><TableBody>{activities.map((activity) => <TableRow key={activity.id}><TableCell>{activity.createdAt.toLocaleString()}</TableCell><TableCell>{activity.action}</TableCell><TableCell>{activity.area}</TableCell><TableCell>{[activity.actor?.firstName, activity.actor?.lastName].filter(Boolean).join(" ") || activity.actor?.name || activity.actor?.email || "System"}</TableCell><TableCell><Badge variant={activity.outcome === "SUCCESS" ? "default" : "destructive"}>{activity.outcome}</Badge></TableCell></TableRow>)}{!activities.length && <TableRow><TableCell colSpan={5} className="text-center">No activity recorded.</TableCell></TableRow>}</TableBody></Table></div></section><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={pending || !user || !roleId} onClick={() => user && onSubmit({ id: user.id, firstName: firstName || null, lastName: lastName || null, bio: bio || null, imageUrl: imageUrl || null, roleId })}>Save</Button></DialogFooter></DialogContent></Dialog>;
}
