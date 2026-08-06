import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { PaletteIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";

import { PALETTE_COLORS, THEME_COLORS } from "@/puck/constants";

// 1. Creiamo un componente riutilizzabile per il Popover
export const ColorPickerPopover = ({ editor }: { editor: Editor }) => {
  // 1. Trasforma currentColor in uno stato React
  const [currentColor, setCurrentColor] = useState(
    editor.getAttributes("textStyle").color,
  );

  // 2. Ascolta i cambiamenti dell'editor di Tiptap
  useEffect(() => {
    const handleUpdate = () => {
      setCurrentColor(editor.getAttributes("textStyle").color);
    };

    // Tiptap emette 'transaction' per ogni modifica (testo, stile, formattazione)
    // ed emette 'selectionUpdate' quando il cursore si sposta
    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    // Sincronizza al mount
    handleUpdate();

    // Pulizia degli event listener
    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  const handleSetColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };
  const handleResetColor = () => {
    editor.chain().focus().unsetColor().run();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          className="flex items-center justify-center h-7 hover:bg-(--puck-color-grey-10) p-0 rounded transition-colors hover:text-(--puck-color-azure-04)"
          variant="ghost"
        >
          <PaletteIcon className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-56 p-3 space-y-4"
      >
        {/* RIGA 1: Colori del Tema */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Tema</p>
          <div className="flex flex-wrap gap-2">
            {THEME_COLORS.map((color) => (
              <Button
                key={color.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSetColor(color.value)}
                className={cn(
                  `size-6 p-0  rounded-full cursor-pointer transition-transform hover:scale-110 border border-secondary`,
                  currentColor === color.value &&
                    `ring-2 ring-primary ring-offset-1`,
                )}
                style={{ backgroundColor: color.bgPreview }}
              />
            ))}
          </div>
        </div>

        {/* RIGA 2: Palette Colori e Custom */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Palette</p>
          <div className="flex flex-wrap gap-2">
            {PALETTE_COLORS.map((color) => (
              <Button
                key={color}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSetColor(color)}
                className={cn(
                  `size-6 p-0  rounded-full cursor-pointer transition-transform hover:scale-110 border border-secondary`,
                  currentColor === color && `ring-2 ring-primary ring-offset-1`,
                )}
                style={{ backgroundColor: color }}
              />
            ))}

            {/* Color picker nativo per colori personalizzati */}
            <div
              className="relative size-6 rounded-full overflow-hidden border border-secondary cursor-pointer"
              title="Custom color"
            >
              <input
                type="color"
                value={currentColor?.startsWith("#") ? currentColor : "#000000"}
                onChange={(e) => handleSetColor(e.target.value)}
                className="absolute -top-2 -left-2 size-10 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* RIGA 3: Reset */}
        <div className="pt-2 border-t border-secondary">
          <Button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleResetColor}
            className="w-full py-1 text-xs text-center text-muted-foreground rounded transition-colors"
            variant="ghost"
          >
            Rimuovi colore
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
