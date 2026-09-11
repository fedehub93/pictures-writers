/**
 * An empty TipTap document shape, matching the JSON structure used by the
 * `tiptapBodyData` column on Post.  Exported here so every test file can
 * reference the same canonical fixture instead of inlining the literal.
 */
export const emptyTiptapDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
};
