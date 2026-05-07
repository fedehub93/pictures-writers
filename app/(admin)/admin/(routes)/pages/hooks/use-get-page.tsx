import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetPage = (id?: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["page", { id }],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/pages/${id}`);
      return response.data;
    },
  });

  return query;
};
