import { DEFAULT_UNIT } from "./constants";

export interface ParsedValue {
  num: string;
  unit: string;
  isValid: boolean;
}

export const parseCSSValue = (
  val: string | undefined,
  allowedUnits: string[],
  allowedKeywords: string[],
  fallbackUnit: string = DEFAULT_UNIT,
): ParsedValue => {
  if (!val || val.trim() === "") {
    return { num: "", unit: "-", isValid: true };
  }

  const cleanVal = String(val).trim();

  if (allowedKeywords.includes(cleanVal.toLowerCase())) {
    return { num: cleanVal, unit: "-", isValid: true };
  }

  const match = cleanVal.match(/^([-+]?(?:\d+\.?\d*|\.\d+))\s*(.*)$/);
  if (match) {
    const numPart = match[1];
    const incomingUnit = match[2].trim().toLowerCase();

    if (incomingUnit && allowedUnits.includes(incomingUnit)) {
      return { num: numPart, unit: incomingUnit, isValid: true };
    }

    if (!incomingUnit) {
      return { num: numPart, unit: fallbackUnit, isValid: true };
    }
  }

  return { num: cleanVal, unit: "-", isValid: false };
};

export const formatCSSValue = (
  numStr: string,
  unitStr: string,
  allowedKeywords: string[],
): string => {
  if (numStr === "") return "";
  if (unitStr === "-" || allowedKeywords.includes(numStr.toLowerCase())) {
    return numStr;
  }
  return `${numStr}${unitStr}`;
};

export const calculateStepValue = (
  currentNumStr: string,
  direction: 1 | -1,
  modifiers: { shiftKey?: boolean; altKey?: boolean; metaKey?: boolean },
): string => {
  let stepAmount = 1;
  if (modifiers.shiftKey) stepAmount = 10;
  if (modifiers.altKey || modifiers.metaKey) stepAmount = 0.1;

  const parsedNum = parseFloat(currentNumStr);
  const currentNum = isNaN(parsedNum) ? 0 : parsedNum;
  return String(parseFloat((currentNum + direction * stepAmount).toFixed(1)));
};
