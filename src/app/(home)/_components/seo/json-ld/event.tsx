import React, { FC } from "react";
import { Event, Graph, ItemAvailability, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";
import { toRomeIso } from "./lib/rome-time";

export interface EventJsonLdProps {
  name: string;
  description?: string;
  url: string;
  image?: string;
  organizerName: string;
  siteUrl: string;
  inLanguage?: string;
  seats?: number;
  lessons: {
    name?: string;
    date: string;
    startTime: string;
    endTime: string;
  }[];
  offers?: {
    priceCurrency: string;
    price: string;
    url: string;
    availability: ItemAvailability;
  };
}

export const EventJsonLd: FC<EventJsonLdProps> = ({
  name,
  description,
  url,
  image,
  organizerName,
  siteUrl,
  inLanguage = "it-IT",
  seats,
  lessons,
  offers,
}) => {
  const lessonTimes = lessons.map((lesson, index) => ({
    lesson,
    index,
    startDate: toRomeIso(lesson.date, lesson.startTime),
    endDate: toRomeIso(lesson.date, lesson.endTime),
  }));
  const validLessons = lessonTimes.filter(
    (lessonTime): lessonTime is typeof lessonTime & {
      startDate: string;
      endDate: string;
    } => Boolean(lessonTime.startDate && lessonTime.endDate),
  );

  if (validLessons.length === 0) {
    return null;
  }

  const events: Event[] = validLessons.map(({ lesson, index, startDate, endDate }) => ({
    "@type": "Event",
    "@id": `${url}#event-${index + 1}`,
    name: lesson.name ? `${name} — ${lesson.name}` : name,
    description,
    url,
    startDate,
    endDate,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    inLanguage,
    location: {
      "@type": "VirtualLocation",
      url,
    },
    ...(image ? { image } : {}),
    ...(seats ? { maximumVirtualAttendeeCapacity: seats } : {}),
    organizer: {
      "@type": "Organization",
      name: organizerName,
      url: siteUrl,
    },
    ...(offers
      ? {
          offers: {
            "@type": "Offer",
            "@id": `${url}#offer-${index + 1}`,
            priceCurrency: offers.priceCurrency,
            price: offers.price,
            url: offers.url,
            availability: offers.availability,
          },
        }
      : {}),
  }));

  if (events.length === 1) {
    const json: WithContext<Event> = {
      "@context": "https://schema.org",
      ...events[0],
    };
    return <JsonLd json={json} />;
  }

  const graph: Graph = {
    "@context": "https://schema.org",
    "@graph": events,
  };

  return <JsonLd json={graph} />;
};