import { useState } from "react";
import type { ValueUnitPreset } from "../types";
import { parseCSSValue, formatCSSValue, calculateStepValue } from "../utils";
import {
  CUSTOM_UNIT,
  DEFAULT_KEYWORDS,
  DEFAULT_UNIT,
  DEFAULT_UNITS,
} from "../constants";

export interface UseValueUnitInputOptions {
  value?: string;
  onChange: (val: string) => void;
  units?: string[];
  defaultUnit?: string;
  allowedKeywords?: string[];
}

export function useValueUnitInput({
  value = "",
  onChange,
  units = DEFAULT_UNITS,
  defaultUnit = DEFAULT_UNIT,
  allowedKeywords = DEFAULT_KEYWORDS,
}: UseValueUnitInputOptions) {
  // DA RIFATTORIZZARE
  const getInitialState = (val: string) => {
    const parsed = parseCSSValue(val, units, allowedKeywords, defaultUnit);
    if (!parsed.isValid && val.trim() !== "") {
      return { num: val, unit: CUSTOM_UNIT };
    }
    return { num: parsed.num, unit: parsed.unit };
  };

  const initialState = getInitialState(value);

  const [textInput, setTextInput] = useState(initialState.num);
  const [selectedUnit, setSelectedUnit] = useState(initialState.unit);
  const [prevPropValue, setPrevPropValue] = useState(value);

  if (value !== prevPropValue) {
    const state = getInitialState(value);
    setTextInput(state.num);
    setSelectedUnit(state.unit);
    setPrevPropValue(value);
  }

  const commitValue = (numStr: string, unitStr: string) => {
    if (unitStr === CUSTOM_UNIT) {
      onChange(numStr);
    } else {
      onChange(formatCSSValue(numStr, unitStr, allowedKeywords));
    }
  };

  const handleCommit = () => {
    if (selectedUnit === CUSTOM_UNIT) {
      commitValue(textInput, CUSTOM_UNIT);
      return;
    }

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
      const fallback = getInitialState(value);
      setTextInput(fallback.num);
      setSelectedUnit(fallback.unit);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
  };

  const handleUnitChange = (newUnit: string) => {
    if (newUnit === CUSTOM_UNIT) {
      setSelectedUnit(CUSTOM_UNIT);
      commitValue(textInput, CUSTOM_UNIT);
      return;
    }

    const parsedNum = parseFloat(textInput);
    const validNum = isNaN(parsedNum) ? "1" : String(parsedNum);

    setSelectedUnit(newUnit);
    setTextInput(validNum);
    commitValue(validNum, newUnit);
  };

  const handleStep = (
    direction: 1 | -1,
    modifiers: { shiftKey?: boolean; altKey?: boolean; metaKey?: boolean } = {},
  ) => {
    if (selectedUnit === CUSTOM_UNIT) return;

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
