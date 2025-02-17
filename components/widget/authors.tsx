import Image from "next/image";

interface WidgetAuthorProps {
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  imageUrl: string | null;
  twitterUrl?: string;
  linkedinUrl?: string;
}

interface WidgetAuthorsProps {
  authors: WidgetAuthorProps[];
}

const WidgetAuthors = ({ authors }: WidgetAuthorsProps): JSX.Element => {
  const authorLabel = authors.length > 1 ? `Autori` : `Autore`;
  const widgetTitle = `${authorLabel} dell'articolo`;
  return (
    <div className="flex flex-col gap-y-6">
      <div className="text-xl font-extrabold uppercase">{widgetTitle}</div>
      {authors.map((a) => (
        <div key={a.lastName} className="author">
          {a.imageUrl && (
            <div className="relative w-40 min-w-40 grayscale border-4 aspect-square rounded-full overflow-hidden">
              <Image
                src={a.imageUrl}
                alt="Profile image"
                className="object-cover"
                width={400}
                height={400}
                quality={50}
                style={{ height: "100%", width: "auto" }}
              />
            </div>
          )}
          <div className="my-auto p-3 pt-0 ">
            <p className="mb-4 text-xl font-semibold">{`${a.firstName} ${a.lastName}`}</p>

            <p className="author__bio">{a.bio}</p>
          </div>
          <div className="author__social">
            {a.twitterUrl && (
              <a
                className="mx-2"
                href={a.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="../../images/twitter.svg"
                  alt="twitter"
                  width={4}
                  height={4}
                />
              </a>
            )}
            {a.linkedinUrl && (
              <a
                className="mx-2"
                href={a.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="../../images/linkedin.svg"
                  alt="linkedin"
                  width={4}
                  height={4}
                />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WidgetAuthors;
