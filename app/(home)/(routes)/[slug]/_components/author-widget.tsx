import Image from "next/image";

interface AuthorWidgetProps {
  firstName: string;
  lastName: string;
  bio?: string;
  imageUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
}

const AuthorWidget = ({
  firstName,
  lastName,
  bio,
  imageUrl,
  twitterUrl,
  linkedinUrl,
}: AuthorWidgetProps): JSX.Element => {
  return (
    <div className="author">
      {imageUrl && (
        <div className="relative w-40 grayscale border-4 aspect-square rounded-full overflow-hidden">
          <Image
            src={imageUrl}
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
        <p className="mb-4 text-xl font-semibold">{`${firstName} ${lastName}`}</p>

        <p className="author__bio">{bio}</p>
      </div>
      <div className="author__social">
        {twitterUrl && (
          <a
            className="mx-2"
            href={twitterUrl}
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
        {linkedinUrl && (
          <a
            className="mx-2"
            href={linkedinUrl}
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
  );
};

export default AuthorWidget;
