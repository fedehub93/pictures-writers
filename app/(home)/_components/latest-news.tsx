import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

import { db } from "@/lib/db";
import { ContentStatus } from "@prisma/client";

const LatestNews = async () => {
  const latestNews = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    include: {
      imageCover: true,
      user: true,
    },
    take: 3,
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return (
    <section className="bg-violet-100/40 px-4 py-20 lg:px-6">
      <div className="mx-auto max-w-lg md:max-w-screen-md lg:max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold">Ultimi articoli</h2>
        <p className="mx-auto mb-12 max-w-lg text-center">
          Resta aggiornato con i nostri articoli più recenti per alimentare la
          tua passione e migliorare continuamente le tue abilità di
          sceneggiatore.
        </p>
        <div className="mx-auto grid grid-cols-1 gap-8 lg:grid-cols-3">
          {latestNews.map((post) => {
            return (
              <div key={post.title}>
                {post.imageCover ? (
                  <div
                    key={post.title}
                    className="relative aspect-video overflow-clip mb-4 rounded-md"
                  >
                    <Link
                      href={post.slug}
                      className="w-full h-full inset-0 absolute z-10"
                      prefetch={true}
                    />
                    <Image
                      alt={post.imageCover.altText || ""}
                      src={post.imageCover.url}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1023px) 75vw, 20vw"
                    />
                  </div>
                ) : null}
                <div className="mb-2 flex uppercase">
                  <span>
                    {formatDistance(post.createdAt, new Date(), {
                      addSuffix: true,
                      locale: it,
                    })}
                    &nbsp;
                  </span>
                  <span>
                    {post?.user?.firstName} {post?.user?.lastName}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold leading-5 text-heading">
                  {post.title}
                </h3>
                <p className="mb-4 leading-6 ">{post.description}</p>
                <Link
                  href={post.slug}
                  className="font-bold text-primary-public flex items-center gap-x-2"
                >
                  Scopri di più <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LatestNews;
