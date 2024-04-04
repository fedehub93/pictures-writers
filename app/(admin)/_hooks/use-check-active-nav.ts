import { usePathname } from "next/navigation";

export const useCheckActiveNav = () => {
  const pathname = usePathname();

  const checkActiveNav = (href: string) => {
    return !!pathname.startsWith(href);
  };

  return { checkActiveNav };
};
