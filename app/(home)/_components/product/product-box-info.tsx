import { LucideIcon } from "lucide-react";

interface ProductBoxInfoProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
}

export const ProductBoxInfo = ({ label, value, Icon }: ProductBoxInfoProps) => {
  return (
    <div className="flex-1 flex flex-col gap-y-3 items-center text-center">
      <span className="text-sm">{label}</span>
      <Icon className="h-10 w-10" strokeWidth={1.5} />
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
};
