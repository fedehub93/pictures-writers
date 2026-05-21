"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { BeatLoader } from "react-spinners";

import { Button } from "@/components/ui/button";

interface BuyProps {
  productId: string;
}
export const BuyButton = ({ productId }: BuyProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onBuy = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      toast.error("Qualcosa è andato storto!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button type="button" className="flex" onClick={onBuy}>
        Acquista
        <BeatLoader color="white" loading={isLoading} className={`ml-4`} />
      </Button>
    </div>
  );
};
