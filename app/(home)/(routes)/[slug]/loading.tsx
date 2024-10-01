import { Loader2 } from "lucide-react";

export const loading = () => {
  return (
    <div className="w-full h-full flex flex-col gap-y-4 items-center justify-center">
      <div>Stiamo caricando la pagina...</div>
      <Loader2 className="animate-spin" />
    </div>
  );
};

export default loading;
