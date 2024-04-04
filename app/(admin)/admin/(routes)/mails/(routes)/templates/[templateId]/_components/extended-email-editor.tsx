"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { EditorRef, EmailEditorProps, Editor } from "react-email-editor";
import { EmailTemplateActions } from "./actions";
import React from "react";

interface ExtendedEmailEditorProps {
  templateId: string;
  templateData: any;
  onReady: (editor: Editor) => void;
  onLoad: (editor: Editor) => void;
}

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

export const ExtendedEmailEditor = React.forwardRef<
  EditorRef | null,
  ExtendedEmailEditorProps
>(
  (
    { templateId, templateData, onReady, onLoad }: ExtendedEmailEditorProps,
    ref
  ) => {
    return (
      <div ref={ref} className="flex flex-col h-full">
        {/* <EmailTemplateActions templateId={templateId} /> */}
        <EmailEditor ref={ref} onReady={onReady} onLoad={onLoad} />
      </div>
    );
  }
);

ExtendedEmailEditor.displayName = "ExtendedEmailEditor";
