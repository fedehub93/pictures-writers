import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/input-group";

interface ValueUnitInputProps {
  name: string;
  value?: string;
  onChange: (val: string) => void;
  units?: string[];
  placeholder?: string;
}

// 1. ESTRAZIONE: Funzione pura fuori dal componente
const parseCSSValue = (val: string | undefined, allowedUnits: string[]) => {
  if (!val) return { num: "", unit: "-" };

  const match = String(val)
    .trim()
    .match(/^([-+]?(?:\d+\.?\d*|\.\d+))\s*(.*)$/);

  if (match) {
    const numPart = match[1];
    const incomingUnit = match[2].trim().toLowerCase();

    if (incomingUnit && allowedUnits.includes(incomingUnit)) {
      return { num: numPart, unit: incomingUnit };
    } else if (!incomingUnit) {
      return { num: numPart, unit: "px" }; // Fallback
    }
    return { num: numPart, unit: "-" }; // Spazzatura
  }

  return { num: String(val), unit: "-" };
};

export function ValueUnitInput({
  name,
  value = "",
  onChange,
  units = ["-", "px", "rem", "em", "%", "vw", "vh"],
  placeholder,
}: ValueUnitInputProps) {
  const [localNum, setLocalNum] = useState(
    () => parseCSSValue(value, units).num,
  );
  const [localUnit, setLocalUnit] = useState(
    () => parseCSSValue(value, units).unit,
  );

  const [prevPropValue, setPrevPropValue] = useState(value);

  if (value !== prevPropValue) {
    const parsed = parseCSSValue(value, units);
    setLocalNum(parsed.num);
    setLocalUnit(parsed.unit);
    setPrevPropValue(value);
  }

  const applyChange = (newNum: string, newUnit: string) => {
    // 1. Aggiorna lo stato visivo (Input e Tendina)
    setLocalNum(newNum);
    setLocalUnit(newUnit);

    // 2. Comunica con Puck nel formato corretto
    if (newNum === "") {
      onChange(""); // Se è vuoto, rimuove la prop CSS
    } else if (newUnit === "-") {
      onChange(newNum); // Se non c'è unità, passa il valore puro (es. "auto")
    } else {
      onChange(`${newNum}${newUnit}`); // Altrimenti concatena (es. "15px")
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value; // Es: "15", "20rem", "auto", o ""

    // 1. L'utente ha cancellato tutto
    if (rawValue === "") {
      applyChange("", "-");
      return;
    }

    // Controlla se l'utente ha scritto l'unità direttamente nell'input (es. "100px")
    const match = rawValue.trim().match(/^([-+]?(?:\d+\.?\d*|\.\d+))\s*(.*)$/);
    if (match) {
      const numPart = match[1]; // "100" o "15.5" o "-20"
      const stringPart = match[2].trim(); // "px" o "rem" o "auto"

      // SCENARIO A: L'utente ha incollato o digitato numero + unità (es. "20rem")
      if (stringPart && units.includes(stringPart)) {
        applyChange(numPart, stringPart);
        return;
      }

      // SCENARIO B: L'utente sta digitando solo un numero (es. "15")
      if (!stringPart) {
        const finalUnit = localUnit === "-" || !localUnit ? "px" : localUnit;
        applyChange(numPart, finalUnit);
        return;
      }
    }

    // SCENARIO C: Testo puro come "auto"
    applyChange(rawValue, "-");
  };

  const handleUnitChange = (newUnit: string) => {
    // Se l'input attuale è testo (es "auto") e scelgo "px", forziamo a "0"
    const parsedNum = parseFloat(localNum);
    const validNum = isNaN(parsedNum) ? "0" : localNum;

    applyChange(validNum, newUnit);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault(); // Evita che il cursore vada all'inizio del testo
      handleStep(1, e);
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); // Evita che il cursore vada alla fine del testo
      handleStep(-1, e);
    }
  };

  const handleStep = (
    direction: 1 | -1,
    e?: React.MouseEvent | React.KeyboardEvent,
  ) => {
    let stepAmount = 1;
    if (e) {
      if (e.shiftKey) stepAmount = 10;
      if (e.altKey || e.metaKey) stepAmount = 0.1;
    }

    const parsedNum = parseFloat(localNum);
    const currentNum = isNaN(parsedNum) ? 0 : parsedNum;
    const nextNumStr = String(
      parseFloat((currentNum + direction * stepAmount).toFixed(1)),
    );

    // Se si usano le frecce su un valore testuale, si forza "px" di default
    const finalUnit = localUnit === "-" || !localUnit ? "px" : localUnit;

    applyChange(nextNumStr, finalUnit);
  };

  return (
    <InputGroup className="h-8 bg-background flex shadow-none focus-within:ring-2! focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <InputGroupInput
        id={name}
        name={name}
        type="text"
        value={localNum}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-xs!"
      />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <InputGroupButton
              variant="ghost"
              className="mr-5 border-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted text-xs"
            >
              {localUnit}
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-16">
            {units.map((u) => (
              <DropdownMenuItem
                key={u}
                onClick={() => handleUnitChange(u)}
                className="text-xs"
              >
                {u}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="absolute right-0.5 top-0 flex h-full flex-col items-center justify-center space-y-0 pr-1 opacity-50 transition-opacity hover:opacity-100">
          <button
            type="button"
            tabIndex={-1}
            className="cursor-pointer rounded px-0.5 pb-px hover:bg-muted focus:outline-none"
            onClick={(e) => handleStep(1, e)}
          >
            <ChevronUp className="size-2.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="cursor-pointer rounded px-0.5 pt-px hover:bg-muted focus:outline-none"
            onClick={(e) => handleStep(-1, e)}
          >
            <ChevronDown className="size-2.5" />
          </button>
        </div>
      </InputGroupAddon>
    </InputGroup>
  );
}
