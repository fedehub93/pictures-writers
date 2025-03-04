"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useCallback } from "react";

interface BuyModalProps {
  productId: string;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const BuyModal = ({ productId }: BuyModalProps) => {
  const fetchClientSecret = useCallback(() => {
    // Create a Checkout Session
    try {
      return fetch("/api/checkout/embedded", {
        method: "POST",
        body: JSON.stringify({
          productId,
        }),
      })
        .then((res) => res.json())
        .then((data) => data.client_secret);
    } catch (error) {
      throw new Error("Error");
    }
  }, [productId]);

  const options = { fetchClientSecret };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">Acquista</Button>
      </DialogTrigger>
      <DialogContent className="my-4 py-12 xl:max-w-screen-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Pictures Writers</DialogTitle>
        </DialogHeader>
        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Annulla
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
