"use client";

import { AtSignIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { type EmailAccountAllowed } from "@/modules/mails/accounts/types";

interface AccountSelectorProps {
  accounts: EmailAccountAllowed[];
  value?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export const AccountSelector = ({
  accounts,
  value,
  onChange,
  disabled,
}: AccountSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full" aria-label="Email account">
        <AtSignIcon className="text-muted-foreground" />
        <SelectValue placeholder="Select an account" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{account.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {account.email}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
