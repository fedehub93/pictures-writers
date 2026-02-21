import { SocialKey } from "@/generated/prisma";

export const DEFAULT_SOCIAL_CHANNEL_VALUES: {
  key: SocialKey;
  url: string;
}[] = [
  {
    key: SocialKey.FACEBOOK,
    url: "",
  },
  {
    key: SocialKey.INSTAGRAM,
    url: "",
  },
  {
    key: SocialKey.LINKEDIN,
    url: "",
  },
  {
    key: SocialKey.TWITTER,
    url: "",
  },
  {
    key: SocialKey.PINTEREST,
    url: "",
  },
  {
    key: SocialKey.YOUTUBE,
    url: "",
  },
];
