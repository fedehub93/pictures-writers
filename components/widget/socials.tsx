import { SocialKey } from "@/generated/prisma";
import { SocialIcon } from "react-social-icons";

import { getWidgetSocials } from "@/data/widget";

interface WidgetSocialProps {
  label: string;
  socials: {
    key: SocialKey;
    isVisible: boolean;
    sort: number;
  }[];
}

export const WidgetSocial = async ({ label, socials }: WidgetSocialProps) => {
  const data = await getWidgetSocials({ socials });
  return (
    <div className="w-full bg-white px-6 pt-8 pb-8 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-4 text-sm font-extrabold uppercase">{label}</h3>

      <div className="flex flex-wrap gap-x-4">
        {data.map((d) => {
          return (
            <SocialIcon
              key={d.key}
              href={d.url!}
              network={d.key.toLowerCase()}
              style={{ height: 45, width: 45 }}
              className="p-2 scale-90 hover:scale-[1.02] transition-all duration-500 cursor-pointer"
            />
          );
        })}

        <SocialIcon
          href="mailto:support@pictureswriters.com"
          network="email"
          style={{ height: 45, width: 45 }}
          className="p-2 scale-90 hover:scale-[1.02] transition-all duration-500 cursor-pointer"
          bgColor="rgb(76, 63, 217)"
        />
      </div>
    </div>
  );
};
