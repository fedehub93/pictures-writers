"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

interface InviteUserDialogProps {
  open: boolean;
  roles: { id: string; name: string }[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (value: { email: string; roleId: string }) => void;
}

export function InviteUserDialog({
  open,
  roles,
  pending,
  onClose,
  onSubmit,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            aria-label="Email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || !email || !roleId}
            onClick={() => onSubmit({ email, roleId })}
          >
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
