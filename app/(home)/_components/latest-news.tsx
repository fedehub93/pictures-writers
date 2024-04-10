import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

import { db } from "@/lib/db";

const LatestNews = async () => {
  const latestNews = await db.post.findMany({
    where: {
      isPublished: true,
    },
    include: {
      imageCover: true,
      user: true,
      versions: {
        include: {
          imageCover: true,
        },
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    take: 3,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <section className="bg-indigo-100/40 px-4 py-20 lg:px-6">
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
              <div key={post.versions[0]?.title}>
                {post.versions[0]?.imageCover ? (
                  <div
                    key={post.title}
                    className="relative aspect-video overflow-clip mb-4 rounded-md"
                  >
                    <Link
                      href={post.slug}
                      className="w-full h-full inset-0 absolute z-10"
                    />
                    <Image
                      alt={post.versions[0]?.imageCover.altText || ""}
                      src={post.versions[0]?.imageCover.url}
                      fill
                      className="object-cover"
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
                  <span>{post.user.id}</span>
                </div>
                <h3 className="mb-2 text-lg font-bold leading-5 text-heading">
                  {post.versions[0]?.title}
                </h3>
                <p className="mb-4 leading-6 ">
                  {post.versions[0]?.description}
                </p>
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
