// @vitest-environment happy-dom
import {
  createRef,
  forwardRef,
  useImperativeHandle,
  type ReactElement,
} from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";

import { useAutoSave } from "./use-auto-save";

interface FormValues {
  name: string;
}

interface TestRef {
  simulateChange: (value: string) => void;
}

const TestComponent = forwardRef<
  TestRef,
  { onSave: (data: Partial<FormValues>) => void; delay?: number }
>(({ onSave, delay }, ref) => {
  const form = useForm<FormValues>({
    defaultValues: { name: "" },
  });
  const save = useAutoSave(form, onSave, delay);

  useImperativeHandle(ref, () => ({
    simulateChange: (value) => {
      form.setValue("name", value, { shouldDirty: true });
      save();
    },
  }));

  return <input value={form.watch("name")} readOnly />;
});

TestComponent.displayName = "TestComponent";

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return { root, container };
}

describe("useAutoSave", () => {
  it("does not save when no fields are dirty", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const ref = createRef<TestRef>();

    render(<TestComponent ref={ref} onSave={onSave} />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(onSave).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("debounces a rapid sequence of edits into a single save", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const ref = createRef<TestRef>();

    render(<TestComponent ref={ref} onSave={onSave} />);

    await act(async () => {
      ref.current?.simulateChange("a");
      ref.current?.simulateChange("ab");
      ref.current?.simulateChange("abc");
    });

    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ name: "abc" });

    vi.useRealTimers();
  });

  it("respects a custom delay", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    const ref = createRef<TestRef>();

    render(<TestComponent ref={ref} onSave={onSave} delay={500} />);

    await act(async () => {
      ref.current?.simulateChange("x");
    });

    await act(async () => {
      vi.advanceTimersByTime(499);
    });

    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
