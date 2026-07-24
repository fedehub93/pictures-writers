import type { FormElementInstanceUnion } from "../../builder/types/core";

import { UploadFieldProperties } from "../../builder/types/properties";

interface FieldDataViewerProps {
  instance: FormElementInstanceUnion;
  value: unknown;
}

export function FieldDataViewer({ instance, value }: FieldDataViewerProps) {
  const { label } = instance.properties;

  const renderValue = () => {
    // Gestione empty state
    if (value === undefined || value === null || value === "") {
      return (
        <span className="text-muted-foreground italic text-sm">
          Nessun dato fornito
        </span>
      );
    }

    switch (instance.type) {
      case "TextField":
      case "TextareaField":
      case "SelectField":
        return <span className="text-card-foreground">{String(value)}</span>;

      case "UploadField":
        // Type casting esplicito basato sulla definizione di UploadFieldProperties
        const files = value as UploadFieldProperties["files"];

        if (!Array.isArray(files) || files.length === 0) {
          return (
            <span className="text-muted-foreground italic text-sm">
              Nessun file caricato
            </span>
          );
        }

        return (
          <ul className="flex flex-col gap-2">
            {files.map((file) => (
              <li key={file.key} className="flex items-center gap-x-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/80 hover:text-primary hover:underline font-medium"
                >
                  {file.name}
                </a>
                <span className="text-sm text-muted-foreground">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </li>
            ))}
          </ul>
        );

      default:
        // Fallback per tipi non mappati
        return (
          <pre className="text-xs text-card-foreground bg-muted p-2 rounded">
            {JSON.stringify(value, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 bg-card rounded border">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{renderValue()}</div>
    </div>
  );
}
