"use client";

import "client-only";

import { useModal } from "./use-modal-store";
import type { Media, Product } from "@/generated/prisma";
import type { SlashCommandModalService } from "@/shared/components/tiptap-editor/slash-menu/types";

/**
 * Adapts the admin global modals to the slash command modal contract.
 *
 * This keeps the Tiptap editor surface decoupled from the modal UI: the editor
 * only knows the {@link SlashCommandModalService} interface, while this hook
 * wires the existing pickers (asset, URL, product) as callbacks.
 */
export const useAdminSlashCommandModalService =
  (): SlashCommandModalService => {
    const { onOpen } = useModal();

    return {
      openImagePicker: (onSelect) => {
        onOpen("selectAsset", (media: Media) => {
          onSelect({ src: media.url, alt: media.altText || "" });
        });
      },
      openVideoUrlPicker: (onSelect) => {
        onOpen("selectUrl", (result: { url: string; label?: string }) => {
          onSelect({ src: result.url });
        });
      },
      openProductPicker: (onSelect) => {
        onOpen("selectProduct", (product: Product) => {
          onSelect({ productRootId: product.rootId ?? product.id });
        });
      },
    };
  };
