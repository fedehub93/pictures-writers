"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/shared/ui/select";

import { type EmailAccountAllowed } from "@/modules/mails/accounts/types";

interface AccountSelectorProps {
  accounts: EmailAccountAllowed[];
  value?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

/**
 * Account switcher. The trigger is rendered by hand instead of using
 * `SelectValue`, so the account name and address stay left-aligned on two
 * readable lines. The content uses popper positioning (rather than Radix's
 * item-aligned mode) so no hidden value node is needed to anchor the dropdown.
 */
export const AccountSelector = ({
  accounts,
  value,
  onChange,
  disabled,
}: AccountSelectorProps) => {
  const selected = accounts.find((account) => account.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="h-auto w-full min-w-0 gap-2 px-2 py-1.5 data-[size=default]:h-auto"
        aria-label="Email account"
      >
        <span className="flex min-w-0 flex-1 flex-col items-start text-left leading-tight">
          <span className="w-full truncate text-sm font-medium">
            {selected?.name ?? "Select an account"}
          </span>
          {selected?.email && (
            <span className="w-full truncate text-xs tracking-tight text-muted-foreground">
              {selected.email}
            </span>
          )}
        </span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="[&_[data-radix-select-viewport]]:h-auto"
      >
        <SelectGroup>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <span className="flex min-w-0 flex-col items-start text-left">
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
