"use client";

import { useState } from "react";

import { Review } from "./review";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { Button } from "@/shared/ui/button";

export const ReviewsSection = ({
  testimonials,
}: {
  testimonials: {
    id: string;
    reviewerName: string | null;
    role: string | null;
    rating: number;
    comment: string | null;
    date: Date;
    verifiedPurchase: boolean;
  }[];
}) => {
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const openReview = testimonials.find((t) => t.id === openReviewId);

  return (
    <>
      {openReview && (
        <ResponsiveDialog
          open={Boolean(openReviewId)}
          onOpenChange={(open) => {
            if (!open) setOpenReviewId(null);
          }}
          title={"Recensione"}
          description={""}
        >
          <Review
            name={openReview.reviewerName ?? ""}
            role={openReview.role ?? ""}
            rating={openReview.rating ?? 0}
            comment={openReview.comment ?? ""}
            date={openReview.date}
            verifiedPurchase={openReview.verifiedPurchase}
            showStars
            ActionButton={
              <Button
                variant="ghost"
                className="text-primary h-auto p-0 hover:bg-transparent self-end"
                onClick={() => setOpenReviewId(null)}
              >
                Chiudi
              </Button>
            }
          />
        </ResponsiveDialog>
      )}
      <section
        id="testimonianze"
        className="py-24 bg-primary-foreground border-b border-b-accent"
      >
        <div className="container mx-auto px-6 lg:max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Cosa dicono i nostri studenti
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto"></div>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto text-lg italic">
              "La scrittura è un mestiere solitario, ma non devi impararlo da
              solo."
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t) => {
              return (
                <div
                  key={t.id}
                  className="bg-card p-8 rounded-2xl shadow-sm border relative overflow-hidden group hover:border-primary/50 transition-all"
                >
                  <Review
                    name={t.reviewerName ?? ""}
                    role={t.role ?? ""}
                    rating={t.rating}
                    comment={t.comment ?? ""}
                    date={t.date}
                    verifiedPurchase={t.verifiedPurchase}
                    truncate
                    showStars
                    ActionButton={
                      <Button
                        variant="ghost"
                        className="text-primary h-auto p-0 hover:bg-transparent self-end"
                        onClick={() => setOpenReviewId(t.id)}
                      >
                        Leggi tutto
                      </Button>
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};
