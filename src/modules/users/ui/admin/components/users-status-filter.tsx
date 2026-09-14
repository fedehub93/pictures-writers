"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { useUsersFilters } from "@/modules/users/hooks/use-users-filters";

export const UsersStatusFilter = () => {
  const [filters, setFilters] = useUsersFilters();

  return (
    <Select
      value={filters.status ?? "all"}
      onValueChange={(value) =>
        setFilters({
          status: value === "all" ? null : (value as "ACTIVE" | "SUSPENDED"),
        })
      }
    >
      <SelectTrigger className="h-9 w-[150px]">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};