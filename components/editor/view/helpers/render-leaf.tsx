import { CustomText } from "@/app/(admin)/_components/editor";

export const RenderLeaf = ({ leaf }: { leaf: CustomText }) => {
  let text = <>{leaf.text}</>;

  if (leaf.bold) {
    text = <strong>{text}</strong>;
  }
  if (leaf.italic) {
    text = <em>{text}</em>;
  }
  if (leaf.underline) {
    text = <u>{text}</u>;
  }

  return text;
};
