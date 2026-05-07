import { PageUpdateValues } from "@/app/(admin)/admin/(routes)/pages/schema";
import { Config, Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

type Components = {
  HeadingBlock: {
    children: string;
  };
};

// Create Puck component config
const config: Config<Components> = {
  components: {
    HeadingBlock: {
      fields: {
        children: {
          type: "text",
        },
      },
      render: ({ children }) => {
        return <h1>{children}</h1>;
      },
    },
  },
};

export type PuckEditorProps = {
  id: string;
  initialData: Data;
  onSavePage: (values: PageUpdateValues) => void;
};

// Render Puck editor
export function PuckEditor({ id, initialData, onSavePage }: PuckEditorProps) {
  const onSave = async (data: Data) => {
    onSavePage({ id, puckData: data });
  };

  return <Puck config={config} data={initialData} onPublish={onSave} />;
}
