import { useCallback } from "react";
import { Range, Transforms } from "slate";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from "slate-react";
import { isKeyHotkey } from "is-hotkey";

import { cn } from "@/lib/utils";

import {
  EmbeddedAffiliateLinkElement,
  EmbeddedImageElement,
  EmbeddedVideoElement,
} from "@/app/(admin)/_components/editor";
import { CustomEditorHelper } from "../utils/custom-editor";
import { EmbeddedImage } from "./elements/image";
import { EmbeddedVideo } from "./elements/embedded-video";
import { AffiliateLink } from "./elements/embedded-affiliate-link";
import { EmbeddedProductElement } from "@/app/(admin)/_components/editor";
import FirstImpressionSnippet from "./elements/sponsor-first-impression";
import { EmbeddedProduct } from "./elements/product";
import { InfoBox } from "./elements/info-box";
import {
  Blockquote,
  BulletedList,
  Default,
  HeadingFour,
  HeadingOne,
  HeadingThree,
  HeadingTwo,
  Link,
  ListItem,
  NumberedList,
} from "./elements";

const SOFT_BREAK_ELEMENTS = ["infobox"];

interface EditorInputProps {
  onHandleIsFocused: (value: boolean) => void;
  readonly?: boolean;
}

type Format = "bold" | "italic" | "underline";

const HOTKEYS: Record<string, Format> = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
};

const EditorInput = ({
  onHandleIsFocused,
  readonly = false,
}: EditorInputProps) => {
  const editor = useSlate();

  const renderElement = useCallback((props: RenderElementProps) => {
    // const { selection } = editor;
    // if (!selection) {
    //   return <DefaultElement {...props} />;
    // }

    // Find path of the element and compare with current element
    // const path = ReactEditor.findPath(editor, props.element);
    // const currentPath = selection.anchor.path;
    // const isHighlight = path[0] === currentPath[0];

    switch (props.element.type) {
      case "heading-1":
        return <HeadingOne {...props} />;
      case "heading-2":
        return <HeadingTwo {...props} />;
      case "heading-3":
        return <HeadingThree {...props} />;
      case "heading-4":
        return <HeadingFour {...props} />;
      case "blockquote":
        return <Blockquote {...props} />;
      case "info-box":
        return <InfoBox {...props} />;
      case "hyperlink":
        return <Link {...props} />;
      case "list-item":
        return <ListItem {...props} />;
      case "unordered-list":
        return <BulletedList {...props} />;
      case "ordered-list":
        return <NumberedList {...props} />;
      case "image":
        return (
          <EmbeddedImage
            {...props}
            element={props.element as EmbeddedImageElement}
          />
        );
      case "video":
        return (
          <EmbeddedVideo
            {...props}
            element={props.element as EmbeddedVideoElement}
          />
        );
      case "affiliate-link":
        return (
          <AffiliateLink
            {...props}
            element={props.element as EmbeddedAffiliateLinkElement}
          />
        );
      case "sponsor-first-impression":
        return <FirstImpressionSnippet />;
      case "product":
        return (
          <EmbeddedProduct
            {...props}
            element={props.element as EmbeddedProductElement}
          />
        );
      case "code":
        return <div {...props.attributes}>{props.children}</div>;

      default:
        // return <DefaultElement {...props} isHighlight={isHighlight} />;
        return <Default {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return (
      <span
        {...props.attributes}
        className={cn(
          props.leaf.bold && "font-bold",
          props.leaf.italic && "italic",
          props.leaf.underline && "underline"
        )}
      >
        {props.children}
      </span>
    );
  }, []);

  // Funzione per inserire un nodo valido se il documento è vuoto
  const ensureValidNode = () => {
    if (editor.children.length === 0) {
      const defaultNode = {
        type: "paragraph",
        children: [{ text: "" }],
      };
      Transforms.insertNodes(editor, defaultNode, { at: [0] });
    }
  };

  // Gestore per il click del mouse
  const handleMouseDown = (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    ensureValidNode();
  };

  return (
    <>
      <Editable
        className={cn(
          "border border-t-0 rounded-b-md outline-none p-4",
          readonly && "border-t rounded-t-md mt-4"
        )}
        readOnly={readonly}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onFocus={(e) => {
          onHandleIsFocused(true);
        }}
        onBlur={(e) => {
          onHandleIsFocused(false);
        }}
        onMouseDown={handleMouseDown}
        onKeyDown={(event) => {
          const { selection } = editor;

          // Default left/right behavior is unit:'character'.
          // This fails to distinguish between two cursor positions, such as
          // <inline>foo<cursor/></inline> vs <inline>foo</inline><cursor/>.
          // Here we modify the behavior to unit:'offset'.
          // This lets the user step into and out of the inline without stepping over characters.
          // You may wish to customize this further to only use unit:'offset' in specific cases.
          if (selection) {
            const { nativeEvent } = event;
            for (const hotkey in HOTKEYS) {
              if (isKeyHotkey(hotkey, nativeEvent)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
                CustomEditorHelper.toggleMark(editor, mark);
              }
            }
          }
          if (selection && Range.isCollapsed(selection)) {
            const { nativeEvent } = event;

            if (isKeyHotkey("left", nativeEvent)) {
              event.preventDefault();
              Transforms.move(editor, { unit: "offset", reverse: true });
              return;
            }
            if (isKeyHotkey("right", nativeEvent)) {
              event.preventDefault();
              Transforms.move(editor, { unit: "offset" });
              return;
            }
          }
        }}
      />
    </>
  );
};

export default EditorInput;
