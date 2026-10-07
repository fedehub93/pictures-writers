"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { useProductsFilters } from "./use-products-filters";

interface UseUpdateProductMetadataOptions {
  rootId: string;
  successMessage: string;
  errorMessage: string;
}

/**
 * Shared mutation for the type-specific metadata forms. Saving metadata always
 * refreshes the product list and the current root version, so the type forms
 * only have to describe their own toast copy.
 */
export const useUpdateProductMetadata = ({
  rootId,
  successMessage,
  errorMessage,
}: UseUpdateProductMetadataOptions) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();

  return useMutation(
    trpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success(successMessage);
      },
      onError: (error) => {
        toast.error(error.message || errorMessage);
      },
    }),
  );
};
