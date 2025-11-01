"use client";
import { Separator } from "@/components/ui/separator";
import { TipTapRendererV2 } from "@/components/tiptap-renderer";

interface WebinarInfoProps {
  title: string;
  tiptapDescription: PrismaJson.TipTapBodyData | null;
}

export const WebinarInfo = ({ title, tiptapDescription }: WebinarInfoProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <h1 className="text-4xl">{title}</h1>
      <Separator />
      {tiptapDescription && <TipTapRendererV2 content={tiptapDescription} />}
    </div>
  );
};
