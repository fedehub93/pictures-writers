import { useState } from "react";

import type { ValueUnitPreset } from "./types";

import { parseCSSValue, formatCSSValue, calculateStepValue } from "./utils";
import { DEFAULT_UNIT } from "./constants";

export interface UseValueUnitInputOptions {
  value?: string;
  onChange: (val: string) => void;
  units: string[];
  defaultUnit?: string;
  allowedKeywords: string[];
}

export function useValueUnitInput({
  value = "",
  onChange,
  units,
  defaultUnit = DEFAULT_UNIT,
  allowedKeywords,
}: UseValueUnitInputOptions) {
  const [textInput, setTextInput] = useState(
    () => parseCSSValue(value, units, allowedKeywords, defaultUnit).num,
  );
  const [selectedUnit, setSelectedUnit] = useState(
    () => parseCSSValue(value, units, allowedKeywords, defaultUnit).unit,
  );

  const [prevPropValue, setPrevPropValue] = useState(value);

  if (value !== prevPropValue) {
    const parsed = parseCSSValue(value, units, allowedKeywords, defaultUnit);
    setTextInput(parsed.num);
    setSelectedUnit(parsed.unit);
    setPrevPropValue(value);
  }

  const commitValue = (numStr: string, unitStr: string) => {
    onChange(formatCSSValue(numStr, unitStr, allowedKeywords));
  };

  const handleCommit = () => {
    const currentFallback =
      selectedUnit === "-" || !selectedUnit ? defaultUnit : selectedUnit;
    const parsed = parseCSSValue(
      textInput,
      units,
      allowedKeywords,
      currentFallback,
    );

    if (parsed.isValid) {
      setTextInput(parsed.num);
      setSelectedUnit(parsed.unit);
      commitValue(parsed.num, parsed.unit);
    } else {
      const fallback = parseCSSValue(
        value,
        units,
        allowedKeywords,
        defaultUnit,
      );
      setTextInput(fallback.num);
      setSelectedUnit(fallback.unit);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  const handleUnitChange = (newUnit: string) => {
    const parsedNum = parseFloat(textInput);
    const validNum = isNaN(parsedNum) ? "0" : textInput;

    setSelectedUnit(newUnit);
    setTextInput(validNum);
    commitValue(validNum, newUnit);
  };

  const handleStep = (
    direction: 1 | -1,
    modifiers: { shiftKey?: boolean; altKey?: boolean; metaKey?: boolean } = {},
  ) => {
    const nextNumStr = calculateStepValue(textInput, direction, modifiers);
    const finalUnit =
      selectedUnit === "-" || !selectedUnit ? defaultUnit : selectedUnit;

    setTextInput(nextNumStr);
    setSelectedUnit(finalUnit);
    commitValue(nextNumStr, finalUnit);
  };

  const handlePresetSelect = (preset: ValueUnitPreset) => {
    setTextInput(preset.value);
    setSelectedUnit(preset.unit);
    commitValue(preset.value, preset.unit);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleStep(1, e);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleStep(-1, e);
    }
  };

  return {
    textInput,
    selectedUnit,
    handleInputChange,
    handleCommit,
    handleKeyDown,
    handleUnitChange,
    handleStep,
    handlePresetSelect,
  };
}
