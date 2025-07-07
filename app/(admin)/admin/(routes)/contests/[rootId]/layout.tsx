import { LanguageSwitcher } from "@/app/(admin)/_components/language-switcher";

import { db } from "@/lib/db";
import { MenuButtons } from "./_components/menu-buttons";
import { Separator } from "@/components/ui/separator";

type Params = Promise<{ rootId: string }>;

interface ContestRootIdLayout {
  params: Params;
  children: React.ReactNode;
}

const ContestRootIdLayout = async ({
  params,
  children,
}: ContestRootIdLayout) => {
  const p = await params;

  const activeLanguages = await db.language.findMany({
    where: {
      isActive: true,
    },
  });

  return (
    <div className="flex flex-col w-full relative">
      <div className="w-full flex-col sticky top-0 z-50 flex items-center justify-center gap-x-16 border-b bg-amber-100">
        <div className="w-full flex items-center justify-between h-16 max-w-6xl">
          <MenuButtons rootId={p.rootId} />
          <LanguageSwitcher languages={activeLanguages} />
        </div>
        {/* <div className="size-full bg-white py-4">
          <MenuButtons rootId={p.rootId} />
        </div> */}
      </div>
      <div className="py-4">{children}</div>
    </div>
  );
};

export default ContestRootIdLayout;
