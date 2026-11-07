import { useRef, useEffect, Suspense } from "react";
import { Config, createUsePuck, Puck } from "@puckeditor/core";

import { LoadingState } from "@/shared/components/loading-state";

import { useEditorStore } from "../../store/use-editor-store";

const usePuck = createUsePuck<Config>();

export const PuckBuilder = () => {
  const { width } = usePuck((s) => s.appState.ui.viewports.current);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { scale, setScale, isAutoZoom } = useEditorStore();

  useEffect(() => {
    if (!isAutoZoom) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width;

        const numericWidth =
          typeof width === "string" ? parseInt(width, 10) : width;

        if (!numericWidth) return;

        const calculatedScale = availableWidth / numericWidth;

        setScale(Math.min(1, calculatedScale));
      }
    });

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => observer.disconnect();
  }, [width, isAutoZoom, setScale]);

  return (
    <Suspense
      fallback={
        <LoadingState
          title="Canvas initialization"
          description="The page builder is loading all its elements"
        />
      }
    >
      <div
        ref={wrapperRef}
        className="size-full flex justify-center overflow-auto p-4 bg-secondary"
      >
        {/*
          A ring, not a border: a 1px border would make the iframe 2px narrower
          than the selected viewport and push the tablet canvas below Tailwind's
          768 breakpoint.
        */}
        <div
          style={{
            width: width,
            transform: `scale(${scale})`,
          }}
          className="transition-all duration-300 bg-background ring-1 ring-border"
        >
          <Puck.Preview />
        </div>
      </div>
    </Suspense>
  );
};
