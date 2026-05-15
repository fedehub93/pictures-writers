import { PaletteIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ValueColorInputProps {
  name: string;
  value?: string;
  onChange: (val: string) => void;
  units?: string[];
  placeholder?: string;
}

const themeColors = [
  { label: "Primary", value: "var(--primary)", bgPreview: "var(--primary)" },
  {
    label: "Secondary",
    value: "var(--secondary)",
    bgPreview: "var(--secondary)",
  },
  {
    label: "Muted Foreground",
    value: "var(--muted-foreground)",
    bgPreview: "var(--muted-foreground)",
  },
  {
    label: "Accent Foreground",
    value: "var(--accent-foreground)",
    bgPreview: "var(--accent-foreground)",
  },
];

const paletteColors = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#000000", // Black
  "#ffffff", // White
];

export const ValueColorInput = ({
  name,
  value,
  onChange,
}: ValueColorInputProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex gap-2 items-center">
      {/* Input testuale */}
      <Input
        name={name}
        type="text"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={value}
        onChange={handleInputChange}
        placeholder="#000000"
      />

      {/* Popover con il color picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            title="Choose color"
            className="h-9 w-9 shrink-0 rounded-md border border-input flex items-center justify-center overflow-hidden cursor-pointer"
            style={{
              backgroundColor: value || "transparent",
            }}
          >
            {/* Mostra l'icona solo se non c'è un colore impostato per non nasconderlo */}
            {!value && <PaletteIcon className="size-4 text-muted-foreground" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-4 flex flex-col gap-y-2"
          align="end"
          sideOffset={8}
        >
          {/* RIGA 1: Colori del Tema */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Theme</p>
            <div className="flex flex-wrap gap-2">
              {themeColors.map((color) => (
                <Button
                  key={color.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange(color.value)}
                  className={cn(
                    `size-6 p-0  rounded-full cursor-pointer transition-transform hover:scale-110 border border-secondary`,
                  )}
                  style={{ backgroundColor: color.bgPreview }}
                />
              ))}
            </div>
          </div>

          {/* RIGA 2: Palette Colori */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Palette</p>
            <div className="flex flex-wrap gap-2">
              {paletteColors.map((color) => (
                <Button
                  key={color}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange(color)}
                  className={cn(
                    `size-6 p-0  rounded-full cursor-pointer transition-transform hover:scale-110 border border-secondary`,
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* RIGA 3: Custom */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Custom</p>

            {/* Input color nativo del browser */}
            <Input
              type="color"
              className="w-full h-10 rounded cursor-pointer border-0 p-0"
              value={value || "#000000"}
              onChange={handleInputChange}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
