import { CustomText } from "../../../../app/(admin)/_components/editor";

export const Leaf = ({ leaf }: { leaf: CustomText }) => {
  let element = <>{leaf.text}</>;

  if (leaf.bold) {
    element = <strong>{leaf.text}</strong>;
  }

  if (leaf.italic) {
    element = <i>{leaf.text}</i>;
  }

  if (leaf.underline) {
    element = <u>{leaf.text}</u>;
  }

  return <>{element}</>;
};
