"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";

interface ExtendedPaginationProps {
  page: number;
  perPage: number;
  totalRecords: number;
  totalPages: number;
}

export const ExtendedPagination = ({
  page,
  perPage,
  totalRecords,
  totalPages,
}: ExtendedPaginationProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={createPageURL(page - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={createPageURL(page)}>{page}</PaginationLink>
        </PaginationItem>
        {totalPages - page > 1 && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href={createPageURL(totalPages)}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem>
          <PaginationNext href={createPageURL(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
