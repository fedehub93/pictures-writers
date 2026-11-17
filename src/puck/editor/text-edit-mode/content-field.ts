import type { ComponentConfig } from "@puckeditor/core";

/**
 * The prop a block authors its text in, or `null` when it authors none.
 *
 * The test is the field descriptor, not a list of block names: every block that
 * mounts an inline rich text field gets the behaviour, so a future text block
 * inherits it without being registered anywhere.
 *
 * `contentEditable: false` is Puck's non-editable richtext — it renders a static
 * tree instead of an editor — so there is no mode to open and no content field
 * to promise.
 */
export function contentFieldPath(config: ComponentConfig<any>): string | null {
  const entry = Object.entries(config.fields ?? {}).find(([, field]) => {
    const candidate = field as {
      type?: string;
      contentEditable?: boolean;
    } | null;

    return (
      candidate?.type === "richtext" && candidate.contentEditable !== false
    );
  });

  return entry ? entry[0] : null;
}
