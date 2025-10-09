import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { GetPublishedPostByRootId } from "@/lib/post";

const fetchPostByRootId = async (rootId?: string | null) => {
  if (!rootId) return null;
  const response = await axios.get(`/api/admin/posts/${rootId}`);

  return response.data as GetPublishedPostByRootId;
};

export const usePostRootIdQuery = ({
  rootId,
  enabled = true,
}: {
  rootId?: string | null;
  enabled?: boolean;
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [`post-${rootId}`],
    queryFn: () => fetchPostByRootId(rootId),
    enabled,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
