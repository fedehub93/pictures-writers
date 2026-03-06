import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export const useGetProducts = (s?: string) => {
  const query = useQuery({
    enabled: true,
    queryKey: ["products", { s }],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/shop/products?s=${s}`);
      return response.data as {
        items: {
          id: string;
          title: string;
          imageCover: { url: string; altText: string | null } | null;
        }[];
      };
    },
  });

  return query;
};
