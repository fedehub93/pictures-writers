"use client";

import { SearchIcon } from "lucide-react";
import { debounce } from "nuqs";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { DEFAULT_PAGE } from "../../constants";
import { ORDER_STATUSES } from "../../schemas";
import { useOrderFilters } from "../../hooks/use-orders-filter";

import { ORDER_STATUS_LABELS } from "./order-status-badge";

const ALL_STATUS = "ALL";

export const OrdersSearchFilter = () => {
  const [filters, setFilters] = useOrderFilters();

  return (
    <div className="flex items-center gap-2">
      <InputGroup className="max-w-xs">
        <InputGroupInput
          placeholder="Search by order or customer"
          value={filters.search}
          onChange={(event) =>
            setFilters(
              { search: event.target.value, page: DEFAULT_PAGE },
              { limitUrlUpdates: debounce(500) },
            )
          }
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
      <Select
        value={filters.status ?? ALL_STATUS}
        onValueChange={(value) =>
          setFilters({
            status:
              value === ALL_STATUS
                ? null
                : (value as "DRAFT" | "PENDING" | "COMPLETED" | "CANCELLED"),
            page: DEFAULT_PAGE,
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL_STATUS}>All statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
