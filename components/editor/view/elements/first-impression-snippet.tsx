import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";

type SponsorFirstImpression = Replace<
  Node<"sponsor-first-impression">,
  {
    children: CustomText[];
  }
>;

export const isSponsorFirstImpression =
  createElementNodeMatcher<SponsorFirstImpression>(
    (node): node is SponsorFirstImpression =>
      node.type === "sponsor-first-impression"
  );

export const SponsorFirstImpression = createElementTransform(
  isSponsorFirstImpression,
  ({ key, element, attributes, children }) => (
    <div
      key={key}
      className="snippet first-impression relative border-primary bg-ghostWhite text-center mb-8"
    >
      {children}
      <p className="snippet__sponsor">Sponsor</p>
      <p className="snippet__title ">Feedback gratuito sulla prima pagina</p>
      <p>
        <span className="evidence">
          Hai finito di scrivere la tua ultima sceneggiatura
        </span>{" "}
        e stai cercando un feedback?
      </p>
      <p>
        Lo sai che la{" "}
        <span className="evidence">prima pagina è la più importante?</span>
      </p>
      <p>
        È probabilmente l&apos;unica che verrà letta sicuramente. Da questa{" "}
        <span className="evidence">
          si capisce il tono, lo stile, il genere e l&apos;esperienza dello
          sceneggiatore.
        </span>
      </p>
      <p>
        <span className="evidence">
          Uno sceneggiatore esperto leggerà con cura il tuo lavoro
        </span>{" "}
        e ti darà un breve feedback.
      </p>
      <p>Che aspetti?</p>
      <Link href="/feedback-gratuito-sceneggiatura" className="text-xl">
        <Button>Richiedi il feedback gratuito!</Button>
      </Link>
    </div>
  )
);
