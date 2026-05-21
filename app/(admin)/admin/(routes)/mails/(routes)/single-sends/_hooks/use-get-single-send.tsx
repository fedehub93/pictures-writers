import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetSingleSend = (id?: string) => {
  const query = useQuery({
    enabled: !!id,
    queryKey: ["single-send", { id }],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/single-sends/${id}`);
      return response.data;
    },
  });

  return query;
};
