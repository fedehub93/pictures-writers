import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PostPaginationProps {
  totalPages: number;
  totalPagesToDisplay?: number;
  currentPage: number;
}

export const PostPagination = ({
  totalPages,
  totalPagesToDisplay = 10,
  currentPage,
}: PostPaginationProps) => {
  const showLeftEllipsis = currentPage - 1 > totalPagesToDisplay / 2;
  const showRightEllipsis = currentPage + 1 > totalPagesToDisplay / 2;

  const getPageNumbers = () => {
    if (totalPages <= totalPagesToDisplay) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const half = Math.floor(totalPagesToDisplay / 2);
      // To ensure that the current page is always in the middle
      let start = currentPage - half;
      let end = currentPage + half;
      // If the current page is near the start
      if (start < 1) {
        start = 1;
        end = totalPagesToDisplay;
      }
      // If the current page is near the end
      if (end > totalPages) {
        start = totalPages - totalPagesToDisplay + 1;
        end = totalPages;
      }
      // If showLeftEllipsis is true, add an ellipsis before the start page
      if (showLeftEllipsis) {
        start++;
      }
      // If showRightEllipsis is true, add an ellipsis after the end page
      if (showRightEllipsis) {
        end--;
      }
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  };

  const renderPaginationItems = () => {
    const pageNumbers = getPageNumbers();
    return pageNumbers.map((pageNumber) => (
      <PaginationItem key={pageNumber}>
        <Button
          role="button"
          variant="ghost"
          disabled={currentPage === pageNumber}
          className={cn(
            "hover:bg-violet-100 rounded-full",
            currentPage === pageNumber && "bg-violet-100"
          )}
          asChild
        >
          <Link href={`/blog/${pageNumber}`} prefetch={true}>
            {pageNumber}
          </Link>
        </Button>
      </PaginationItem>
    ));
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            role="button"
            variant="ghost"
            size="icon"
            disabled={currentPage <= 1}
            className="hover:bg-violet-100 rounded-full"
            asChild
          >
            <Link href={`/blog/${currentPage - 1}`} prefetch={true}>
              <ChevronLeft />
            </Link>
          </Button>
        </PaginationItem>
        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {renderPaginationItems()}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <Button
            role="button"
            variant="ghost"
            size="icon"
            disabled={currentPage >= totalPages}
            className="hover:bg-violet-100 rounded-full"
            asChild
          >
            <Link href={`/blog/${currentPage + 1}`} prefetch={true}>
              <ChevronRight />
            </Link>
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
