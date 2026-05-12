import type { CSSProperties } from "react";
// Sostituisci con il percorso corretto al tuo file dei field
import { DimensionProps } from "../fields/dimension";

export function getDimensionProps(dimension?: DimensionProps) {
  // Ritorna un oggetto vuoto se non ci sono dimensioni definite
  if (!dimension) return { className: "", style: {} };

  const style: CSSProperties = {};

  // Iteriamo dinamicamente su tutte le proprietà dell'oggetto
  Object.entries(dimension).forEach(([key, value]) => {
    // Filtriamo i valori non validi, vuoti o "auto".
    // Ignorare "auto" è una best practice per mantenere il DOM HTML pulito
    // ed evitare elementi con style="width: auto; height: auto; margin-top: auto..."
    if (value && value !== "-" && value !== "") {
      // Usiamo l'asserzione di tipo perché Object.entries perde i tipi specifici delle chiavi
      (style as any)[key] = value;
    }
  });

  return {
    // Ritorno un className vuoto per mantenere un'interfaccia coerente
    // con getTypographyProps e facilitare lo spread {...getDimensionProps()}
    className: "",
    style,
  };
}
