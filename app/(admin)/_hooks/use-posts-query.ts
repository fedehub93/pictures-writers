import { Media, Post } from "@/prisma/generated/client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchPosts = async () => {
  const response = await axios.get("/api/admin/posts");

  return response.data as (Post & { imageCover: Media | null })[];
};

export const usePostsQuery = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts"], // Chiave unica per la cache basata sulle date
    queryFn: () => fetchPosts(), // Funzione fetch
    enabled: true,
  });

  return {
    data,
    isLoading,
    isError,
  };
};
