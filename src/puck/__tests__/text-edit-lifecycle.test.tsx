// @vitest-environment happy-dom
import type { Data, PuckAction } from "@puckeditor/core";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEditorStore } from "../editor/store/use-editor-store";
import {
  TextEditSelectionContext,
  useTextEditSelection,
  type TextEditSelectionBridge,
} from "../editor/text-edit-mode/selection-bridge";
import {
  documentHasBlock,
  useTextEditLifecycle,
} from "../editor/text-edit-mode/use-text-edit-lifecycle";

type LifecycleDeps = Parameters<typeof useTextEditLifecycle>[0];

let root: Root | null = null;
let host: HTMLDivElement | null = null;
let bridge: TextEditSelectionBridge | null = null;

const captureBridge = (next: TextEditSelectionBridge | null) => {
  bridge = next;
};

function BridgeProbe() {
  const selection = useTextEditSelection();

  useEffect(() => captureBridge(selection), [selection]);

  return null;
}

function Harness(props: LifecycleDeps) {
  const selection = useTextEditLifecycle(props);

  return (
    <TextEditSelectionContext.Provider value={selection}>
      <BridgeProbe />
    </TextEditSelectionContext.Provider>
  );
}

async function mount(deps: LifecycleDeps) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);

  await render(deps);
}

async function render(deps: LifecycleDeps) {
  await act(async () => {
    root!.render(<Harness {...deps} />);
  });
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  bridge = null;
  useEditorStore.getState().exitTextEditMode();
});

function deps(overrides: Partial<LifecycleDeps> = {}): LifecycleDeps {
  return {
    selectedBlockId: null,
    previewMode: "edit",
    data: documentWith("block"),
    dispatch: vi.fn<(action: PuckAction) => void>(),
    ...overrides,
  };
}

function block(id: string) {
  return { type: "Text", props: { id } };
}

function documentWith(
  id: string | null,
  extra: Record<string, unknown> = {},
): Data {
  return {
    root: { props: {} },
    content: id ? [block(id)] : [],
    zones: {},
    ...extra,
  } as unknown as Data;
}

describe("documentHasBlock", () => {
  it("finds a top-level block by id", () => {
    expect(documentHasBlock(documentWith("block"), "block")).toBe(true);
    expect(documentHasBlock(documentWith("block"), "other")).toBe(false);
  });

  it("finds a block nested in a slot", () => {
    const data = {
      root: { props: {} },
      content: [
        {
          type: "Container",
          props: { id: "container", items: [block("nested")] },
        },
      ],
      zones: {},
    } as unknown as Data;

    expect(documentHasBlock(data, "container")).toBe(true);
    expect(documentHasBlock(data, "nested")).toBe(true);
    expect(documentHasBlock(data, "missing")).toBe(false);
  });

  it("walks the slots of the root", () => {
    const data = {
      root: { props: { header: [block("in-root")] } },
      content: [],
      zones: {},
    } as unknown as Data;

    expect(documentHasBlock(data, "in-root")).toBe(true);
  });
});

describe("text edit lifecycle", () => {
  it("drops an armed block inherited from a previous session", async () => {
    useEditorStore.getState().enterTextEditMode("block");

    await mount(deps());

    expect(useEditorStore.getState().editingTextBlockId).toBeNull();
  });

  it("closes the mode when the canvas switches to interactive preview", async () => {
    await mount(deps());

    act(() => useEditorStore.getState().enterTextEditMode("block"));
    expect(useEditorStore.getState().editingTextBlockId).toBe("block");

    await render(deps({ previewMode: "interactive" }));

    expect(useEditorStore.getState().editingTextBlockId).toBeNull();
  });

  it("clears the mode when the armed block leaves the document", async () => {
    await mount(deps());

    act(() => useEditorStore.getState().enterTextEditMode("block"));

    await render(deps({ data: documentWith(null) }));

    expect(useEditorStore.getState().editingTextBlockId).toBeNull();
  });

  it("keeps the mode while the document still contains the block", async () => {
    await mount(deps());

    act(() => useEditorStore.getState().enterTextEditMode("block"));

    await render(deps({ data: documentWith("block") }));

    expect(useEditorStore.getState().editingTextBlockId).toBe("block");
  });

  it("pushes selection changes to subscribers instead of rendering them", async () => {
    await mount(deps({ selectedBlockId: "first" }));

    const listener = vi.fn();

    act(() => {
      bridge!.subscribe(listener);
    });

    await render(deps({ selectedBlockId: "second" }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(bridge!.getSelectedBlockId()).toBe("second");
  });

  it("stops notifying after the unsubscriber runs", async () => {
    await mount(deps({ selectedBlockId: "first" }));

    const listener = vi.fn();
    let unsubscribe = () => undefined as void;

    act(() => {
      unsubscribe = bridge!.subscribe(listener);
    });

    act(() => unsubscribe());
    await render(deps({ selectedBlockId: "second" }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("deselects through Puck's own action", async () => {
    const dispatch = vi.fn();
    await mount(deps({ dispatch }));

    act(() => bridge!.deselect());

    expect(dispatch).toHaveBeenCalledWith({
      type: "setUi",
      ui: { itemSelector: null },
      recordHistory: false,
    });
  });
});
