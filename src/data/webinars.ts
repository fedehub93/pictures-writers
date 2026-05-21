import { db } from "@/lib/db";
import { WebinarLesson } from "@/types";

export const getPurchasedWebinar = async (webinarRootId: string) => {
  const w = await db.purchase.findMany({
    where: { productRootId: webinarRootId },
    select: { id: true },
  });

  return w.length;
};

export const getLessonRange = (lessons: WebinarLesson[]) => {
  if (!lessons || lessons.length === 0) return { start: null, end: null };
  const sorted = lessons
    .map((l) => ({ ...l, dateObj: new Date(l.date) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  return {
    start: sorted[0].dateObj,
    end: sorted[sorted.length - 1].dateObj,
  };
};
