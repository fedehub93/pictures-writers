import { Separator } from "@/components/ui/separator";
import LanguagesForm from "./_components/languages-form";
import { db } from "@/lib/db";

const LanguagesSettingsPage = async () => {
  const languages = await db.language.findMany();

  return (
    <div className="p-4 w-full rounded-md flex flex-col gap-y-8">
      <div className="flex flex-col flex-1">
        <h3 className="text-lg font-bold space-y-0.5">Languages</h3>
        <p className="text-muted-foreground text-sm">
          Select available languages for the application.
        </p>
      </div>
      <Separator />
      <LanguagesForm languages={languages} />
    </div>
  );
};

export default LanguagesSettingsPage;
