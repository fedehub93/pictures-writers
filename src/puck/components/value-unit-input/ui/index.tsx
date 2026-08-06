// ValueUnitInput.tsx
import { useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { PopoverAnchor } from "@radix-ui/react-popover";

import { cn } from "@/shared/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent } from "@/shared/ui/popover";

import type { ValueUnitInputProps } from "../types";

import { useValueUnitInput } from "../hooks/use-value-unit-input";
import { CUSTOM_UNIT, DEFAULT_UNITS } from "../constants";

export function ValueUnitInput({
  name,
  value = "",
  onChange,
  units = DEFAULT_UNITS,
  defaultUnit,
  allowedKeywords,
  placeholder,
  presets,
}: ValueUnitInputProps) {
  const [openPresets, setOpenPresets] = useState(false);

  const {
    textInput,
    selectedUnit,
    handleInputChange,
    handleCommit,
    handleKeyDown,
    handleUnitChange,
    handleStep,
    handlePresetSelect,
  } = useValueUnitInput({
    value,
    onChange,
    units,
    defaultUnit,
    allowedKeywords,
  });

  const isCustom = selectedUnit === CUSTOM_UNIT;

  const onType = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    if (openPresets) {
      setOpenPresets(false);
    }
  };

  const hasPresets = !!presets && presets.length > 0;

  return (
    <InputGroup className="h-8 bg-background flex shadow-none focus-within:ring-2! focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <Popover open={hasPresets && openPresets} onOpenChange={setOpenPresets}>
        <PopoverAnchor asChild>
          <div className="flex-1">
            <InputGroupInput
              id={name}
              name={name}
              type="text"
              value={textInput}
              onChange={onType}
              // Al click/focus si apre la tendina
              onFocus={() => {
                if (hasPresets) setOpenPresets(true);
              }}
              onBlur={handleCommit}
              onKeyDown={(e) => {
                handleKeyDown(e);
                if (e.key === "Enter" || e.key === "Escape") {
                  setOpenPresets(false);
                }
                // Se preme Freccia Giù e il popover è chiuso, lo riapre per navigare
                if (e.key === "ArrowDown" && hasPresets && !openPresets) {
                  setOpenPresets(true);
                }
              }}
              placeholder={placeholder}
              autoComplete="off"
              className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs! w-full"
            />
          </div>
        </PopoverAnchor>

        {hasPresets && (
          <PopoverContent
            align="center"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onPointerDownOutside={() => setOpenPresets(false)}
            className="w-52 p-1 bg-popover text-popover-foreground rounded-md border shadow-md"
          >
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Presets
              </div>
              {presets.map((preset) => {
                const isSelected =
                  preset.value === textInput && preset.unit === selectedUnit;

                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePresetSelect(preset);
                      setOpenPresets(false);
                    }}
                    className={cn(
                      "text-xs p-0 px-2 h-8 flex items-center justify-between w-full",
                      isSelected && "text-primary",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{preset.label}</span>
                      {preset.description && (
                        <span
                          className={cn(
                            "text-muted-foreground",
                            isSelected && "text-primary",
                          )}
                        >
                          ({preset.description})
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 font-mono text-muted-foreground",
                        isSelected && "text-primary",
                      )}
                    >
                      {preset.value}
                      {preset.unit}
                    </div>
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        )}
      </Popover>

      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <InputGroupButton
              variant="ghost"
              className={cn(
                "border-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted text-xs",
                !isCustom && "mr-5",
              )}
            >
              {selectedUnit}
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-16">
            {units
              .filter((u) => u !== "-")
              .map((u) => (
                <DropdownMenuItem
                  key={u}
                  onClick={() => handleUnitChange(u)}
                  className="text-xs"
                >
                  {u}
                </DropdownMenuItem>
              ))}
            {/* Elementor UX: f(x) visivamente separato in fondo */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleUnitChange(CUSTOM_UNIT)}
              className="text-xs font-semibold text-blue-600"
            >
              {CUSTOM_UNIT}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Nascondiamo i controlli di step se siamo in modalità custom */}
        {!isCustom && (
          <div className="absolute right-0.5 top-0 flex h-full flex-col items-center justify-center space-y-0 pr-1 opacity-50 transition-opacity hover:opacity-100">
            <button
              type="button"
              tabIndex={-1}
              className="cursor-pointer rounded px-0.5 pb-px hover:bg-muted focus:outline-none"
              onClick={(e) => handleStep(1, e)}
            >
              <ChevronUpIcon className="size-2.5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              className="cursor-pointer rounded px-0.5 pt-px hover:bg-muted focus:outline-none"
              onClick={(e) => handleStep(-1, e)}
            >
              <ChevronDownIcon className="size-2.5" />
            </button>
          </div>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
