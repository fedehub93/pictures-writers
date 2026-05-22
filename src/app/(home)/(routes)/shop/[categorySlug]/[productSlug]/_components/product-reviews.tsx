"use client";

import { useEffect, useState } from "react";
import { MessageSquareIcon, StarIcon } from "lucide-react";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { Button } from "@/shared/ui/button";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { Review } from "@/app/(home)/_components/review";

export const ProductReviews = ({
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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const openReview = testimonials.find((t) => t.id === openReviewId);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <section className="border-b pb-6">
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
      <div className="container mx-auto px-2 lg:max-w-6xl flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-4xl">Cosa dicono i nostri studenti</h2>
          {/* <div className="w-20 h-1 bg-primary mx-auto"></div> */}
          <p className="mt-1 max-w-sm mx-auto text-muted-foreground italic">
            "La scrittura è un mestiere solitario, ma non devi impararlo da
            solo."
          </p>
        </div>

        {testimonials.length ? (
          <>
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent className="pl-0 sm:px-1 ">
                {testimonials.map((t) => {
                  return (
                    <CarouselItem key={t.id}>
                      <div className="bg-primary-foreground p-8 rounded-2xl shadow-sm border relative overflow-hidden group hover:border-primary/50 transition-all flex flex-col h-full">
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
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-10 top-[110%] sm:-left-12 sm:top-1/2" />
              <CarouselNext className="right-10 top-[110%] sm:-right-12 sm:top-1/2" />
            </Carousel>
            <div className="py-2 mt-2 sm:mt-0 text-center text-sm text-muted-foreground">
              Recensione {current} di {count}
            </div>
          </>
        ) : (
          <div className="bg-accent rounded-2xl p-8 text-center">
            <div className="size-24 bg-primary-foreground rounded-3xl flex items-center justify-center mx-auto mb-8 border">
              <MessageSquareIcon className="text-primary/30" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-accent-foreground mb-4">
              Ancora nessuna recensione
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed font-medium">
              Sii il primo autore a condividere la tua esperienza con questo
              servizio tuo feedback è prezioso per la nostra community!
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                disabled
              >
                <StarIcon className="size-4" />
                Lascia la prima recensione
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
