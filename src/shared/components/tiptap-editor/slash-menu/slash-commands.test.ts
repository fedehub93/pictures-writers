// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";

import { DEFAULT_INFO_BOX_ICON } from "../extensions/info-box";
import { createProductionExtensions } from "../lib/create-editor-extensions";
import { createSlashCommands, slashCommands } from "./slash-commands";
import { executeSlashCommand } from "./slash-menu-extension";
import type {
  SelectedImage,
  SelectedProduct,
  SelectedVideo,
  SlashCommand,
  SlashCommandModalService,
} from "./types";

const findCommand = (commands: SlashCommand[], id: string): SlashCommand => {
  const command = commands.find((cmd) => cmd.id === id);
  if (!command) throw new Error(`Missing slash command: ${id}`);
  return command;
};

const createEditorWithSlash = (text: string) =>
  new Editor({
    extensions: createProductionExtensions(),
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text }],
        },
      ],
    },
  });

interface FakeModalService {
  service: SlashCommandModalService;
  selectImage: (image: SelectedImage) => void;
  selectVideo: (video: SelectedVideo) => void;
  selectProduct: (product: SelectedProduct) => void;
}

const createFakeModalService = (): FakeModalService => {
  let imageCallback: ((image: SelectedImage) => void) | null = null;
  let videoCallback: ((video: SelectedVideo) => void) | null = null;
  let productCallback: ((product: SelectedProduct) => void) | null = null;

  return {
    service: {
      openImagePicker: (onSelect) => {
        imageCallback = onSelect;
      },
      openVideoUrlPicker: (onSelect) => {
        videoCallback = onSelect;
      },
      openProductPicker: (onSelect) => {
        productCallback = onSelect;
      },
    },
    selectImage: (image) => imageCallback?.(image),
    selectVideo: (video) => videoCallback?.(video),
    selectProduct: (product) => productCallback?.(product),
  };
};

describe("custom slash commands", () => {
  it("includes image, video, product and info-box in the catalog", () => {
    const ids = slashCommands.map((cmd) => cmd.id);

    expect(ids).toContain("image");
    expect(ids).toContain("video");
    expect(ids).toContain("product");
    expect(ids).toContain("info-box");
    expect(ids).not.toContain("tablecontent");
  });

  it("groups media and content commands separately from text commands", () => {
    const imageCommand = slashCommands.find((cmd) => cmd.id === "image");
    const videoCommand = slashCommands.find((cmd) => cmd.id === "video");
    const productCommand = slashCommands.find((cmd) => cmd.id === "product");
    const infoBoxCommand = slashCommands.find((cmd) => cmd.id === "info-box");

    expect(imageCommand?.group).toBe("media");
    expect(videoCommand?.group).toBe("media");
    expect(productCommand?.group).toBe("content");
    expect(infoBoxCommand?.group).toBe("content");
  });

  describe("image", () => {
    it("removes the slash query before opening the picker", () => {
      const { service } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/image");

      const range = { from: 1, to: 7 };
      const result = executeSlashCommand(
        editor,
        findCommand(commands, "image"),
        range,
      );

      expect(result).toBe(true);
      expect(JSON.stringify(editor.getJSON())).not.toContain("/image");
    });

    it("inserts the selected image with the public renderer attributes", () => {
      const { service, selectImage } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/image");

      const range = { from: 1, to: 7 };
      executeSlashCommand(editor, findCommand(commands, "image"), range);

      selectImage({ src: "https://example.com/img.jpg", alt: "example" });

      const json: JSONContent = editor.getJSON();
      const imageNode = json.content?.find((node) => node.type === "image");
      expect(imageNode).toBeDefined();
      expect(imageNode?.attrs).toMatchObject({
        src: "https://example.com/img.jpg",
        alt: "example",
      });
    });

    it("inserts the image at the original position while preserving trailing text", () => {
      const { service, selectImage } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/image after");

      const range = { from: 1, to: 7 };
      executeSlashCommand(editor, findCommand(commands, "image"), range);

      selectImage({ src: "https://example.com/img.jpg", alt: "example" });

      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("image");
      expect(json.content?.[0].attrs).toMatchObject({
        src: "https://example.com/img.jpg",
        alt: "example",
      });
      expect(json.content?.[1].type).toBe("paragraph");
      expect(json.content?.[1].content?.[0].text).toBe(" after");
    });
  });

  describe("video", () => {
    it("removes the slash query before opening the URL modal", () => {
      const { service } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/video");

      const range = { from: 1, to: 7 };
      const result = executeSlashCommand(
        editor,
        findCommand(commands, "video"),
        range,
      );

      expect(result).toBe(true);
      expect(JSON.stringify(editor.getJSON())).not.toContain("/video");
    });

    it("inserts the selected YouTube video with the renderer attribute", () => {
      const { service, selectVideo } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/video");

      const range = { from: 1, to: 7 };
      executeSlashCommand(editor, findCommand(commands, "video"), range);

      selectVideo({ src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });

      const json: JSONContent = editor.getJSON();
      const videoNode = json.content?.find((node) => node.type === "youtube");
      expect(videoNode).toBeDefined();
      expect(videoNode?.attrs).toMatchObject({
        src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      });
    });

    it("inserts the video at the original position while preserving trailing text", () => {
      const { service, selectVideo } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/video after");

      const range = { from: 1, to: 7 };
      executeSlashCommand(editor, findCommand(commands, "video"), range);

      selectVideo({ src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });

      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("youtube");
      expect(json.content?.[1].type).toBe("paragraph");
      expect(json.content?.[1].content?.[0].text).toBe(" after");
    });
  });

  describe("product", () => {
    it("removes the slash query before opening the product picker", () => {
      const { service } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/product");

      const range = { from: 1, to: 9 };
      const result = executeSlashCommand(
        editor,
        findCommand(commands, "product"),
        range,
      );

      expect(result).toBe(true);
      expect(JSON.stringify(editor.getJSON())).not.toContain("/product");
    });

    it("inserts the selected product using the persisted productRootId attribute", () => {
      const { service, selectProduct } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/product");

      const range = { from: 1, to: 9 };
      executeSlashCommand(editor, findCommand(commands, "product"), range);

      selectProduct({ productRootId: "prod-root-123" });

      const json: JSONContent = editor.getJSON();
      const productNode = json.content?.find((node) => node.type === "product");
      expect(productNode).toBeDefined();
      expect(productNode?.attrs).toMatchObject({
        productRootId: "prod-root-123",
      });
    });

    it("inserts the product at the original position while preserving trailing text", () => {
      const { service, selectProduct } = createFakeModalService();
      const commands = createSlashCommands(service);
      const editor = createEditorWithSlash("/product after");

      const range = { from: 1, to: 9 };
      executeSlashCommand(editor, findCommand(commands, "product"), range);

      selectProduct({ productRootId: "prod-root-123" });

      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("product");
      expect(json.content?.[1].type).toBe("paragraph");
      expect(json.content?.[1].content?.[0].text).toBe(" after");
    });
  });

  describe("info-box", () => {
    it("removes the slash query and inserts an info box with default attributes", () => {
      const commands = createSlashCommands();
      const editor = createEditorWithSlash("/info");

      const range = { from: 1, to: 6 };
      const result = executeSlashCommand(
        editor,
        findCommand(commands, "info-box"),
        range,
      );

      expect(result).toBe(true);
      expect(JSON.stringify(editor.getJSON())).not.toContain("/info");

      const json: JSONContent = editor.getJSON();
      const infoBoxNode = json.content?.find((node) => node.type === "infobox");
      expect(infoBoxNode).toBeDefined();
      expect(infoBoxNode?.attrs).toMatchObject({
        icon: DEFAULT_INFO_BOX_ICON,
      });
    });

    it("inserts the info box at the original position while preserving trailing text", () => {
      const commands = createSlashCommands();
      const editor = createEditorWithSlash("/info after");

      const range = { from: 1, to: 6 };
      executeSlashCommand(editor, findCommand(commands, "info-box"), range);

      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("infobox");
      expect(json.content?.[1].type).toBe("paragraph");
      expect(json.content?.[1].content?.[0].text).toBe(" after");
    });
  });
});
