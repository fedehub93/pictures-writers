import { EmailTemplate } from "@/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGetEmailTemplates = () => {
  const query = useQuery({
    enabled: true,
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/mails/templates`);
      return response.data as EmailTemplate[];
    },
  });

  return query;
};
