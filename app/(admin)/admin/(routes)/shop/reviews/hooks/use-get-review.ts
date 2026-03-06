import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetReview = (id?: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["review", { id }],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/shop/reviews/${id}`);
      return response.data;
    },
  });

  return query;
};
