"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

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

  const canDisabledPrev = page === 1;
  const canDisabledNext = page === totalPages;
  const canShowEllipsis = totalPages - page > 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button variant="ghost" disabled={canDisabledPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <Link href={createPageURL(page - 1)}>Previous</Link>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={createPageURL(page)}>{page}</PaginationLink>
        </PaginationItem>
        {canShowEllipsis && (
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
          <Button variant="ghost" disabled={canDisabledNext}>
            <Link href={createPageURL(page + 1)}>Next</Link>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
