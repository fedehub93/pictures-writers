"use client";
import { useState } from "react";
import { Bold, Italic, Underline } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

interface ToolbarOptions {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const Toolbar = () => {
  const [options, setOptions] = useState<ToolbarOptions>({
    bold: false,
    italic: false,
    underline: false,
  });

  return (
    <div className="border rounded-md p-4">
      <div className="flex">
        <Toggle
          pressed={options.bold}
          onPressedChange={(newValue) =>
            setOptions({ ...options, bold: newValue })
          }
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
      </div>
    </div>
  );
};

export default Toolbar;
