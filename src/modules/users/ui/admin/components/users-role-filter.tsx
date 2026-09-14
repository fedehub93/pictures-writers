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

interface UsersRoleFilterProps {
  roles: { id: string; name: string }[];
}

export const UsersRoleFilter = ({ roles }: UsersRoleFilterProps) => {
  const [filters, setFilters] = useUsersFilters();

  return (
    <Select
      value={filters.roleId || "all"}
      onValueChange={(value) =>
        setFilters({ roleId: value === "all" ? "" : value })
      }
    >
      <SelectTrigger className="h-9 w-[170px]">
        <SelectValue placeholder="All roles" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All roles</SelectItem>
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};