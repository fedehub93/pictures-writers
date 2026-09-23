import React, { FC } from "react";
import { Course, ItemAvailability, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";
import { toRomeIso } from "./lib/rome-time";

export interface CourseJsonLdProps {
  name: string;
  description?: string;
  url: string;
  image?: string;
  providerName: string;
  providerUrl: string;
  inLanguage?: string;
  courseMode?: string;
  learningResourceType?: string;
  offers?: {
    priceCurrency: string;
    price: string;
    url: string;
    availability: ItemAvailability;
  };
  lessons: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

export const CourseJsonLd: FC<CourseJsonLdProps> = ({
  name,
  description,
  url,
  image,
  providerName,
  providerUrl,
  inLanguage = "it-IT",
  courseMode = "online",
  learningResourceType,
  offers,
  lessons,
}) => {
  const lessonTimes = lessons
    .map((lesson) => {
      const start = toRomeIso(lesson.date, lesson.startTime);
      const end = toRomeIso(lesson.date, lesson.endTime);
      return { lesson, start, end };
    })
    .filter(
      (lessonTime): lessonTime is typeof lessonTime & {
        start: string;
        end: string;
      } => Boolean(lessonTime.start && lessonTime.end),
    );

  if (lessonTimes.length === 0) {
    return null;
  }

  const sortedLessons = [...lessonTimes].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const startDate = sortedLessons[0].start;
  const endDate = sortedLessons[sortedLessons.length - 1].end;

  const json: WithContext<Course> = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}#course`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    name,
    description,
    url,
    inLanguage,
    ...(image ? { image } : {}),
    ...(learningResourceType ? { learningResourceType } : {}),
    provider: {
      "@type": "Organization",
      name: providerName,
      url: providerUrl,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      "@id": `${url}#course-instance`,
      courseMode,
      startDate,
      endDate,
      location: {
        "@type": "VirtualLocation",
        url,
      },
      ...(offers
        ? {
            offers: {
              "@type": "Offer",
              priceCurrency: offers.priceCurrency,
              price: offers.price,
              url: offers.url,
              availability: offers.availability,
            },
          }
        : {}),
    },
  };

  return <JsonLd json={json} />;
};