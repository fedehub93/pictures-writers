"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Grip, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { AdBlock } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

interface CampaignBlocksProps {
  campaignId: string;
  blocks: AdBlock[];
  isSubmitting: boolean;
}

export const CampaignBlocks = ({
  campaignId,
  blocks,
  isSubmitting,
}: CampaignBlocksProps) => {
  const { onOpen } = useModal();
  const router = useRouter();

  const onExitModal = () => {};

  const onAddNewBlock = () => {
    onOpen("createAdBlock", onExitModal, { campaignId });
  };

  const onDeleteBlock = async (blockId: string) => {
    try {
      await axios.delete(`/api/admin/ads/${campaignId}/blocks/${blockId}`);
      toast.success("Block deleted!");
    } catch (error: any) {
      toast.error("Something went wrong!");
    } finally {
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex justify-between">
          Campaign Blocks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocks.map((b) => {
          return (
            <div
              key={b.id}
              className="border rounded-md flex gap-x-4 items-center"
            >
              <Button
                variant="ghost"
                className="bg-secondary p-6 cursor-grab"
                disabled={isSubmitting}
                type="button"
              >
                <Grip className="h-5 w-5" />
              </Button>
              <div>{b.label}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto mr-4"
                    disabled={isSubmitting}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href={`/admin/ads/${campaignId}/blocks/${b.id}`}>
                    <DropdownMenuItem role="button">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <ConfirmModal onConfirm={() => onDeleteBlock(b.id)}>
                    <Button
                      variant="ghost"
                      className="text-destructive px-2! w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </ConfirmModal>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        <div className="p-4 border-dashed border rounded-md flex justify-center">
          <Button
            variant="outline"
            type="button"
            onClick={onAddNewBlock}
            disabled={isSubmitting}
          >
            Add new block
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
