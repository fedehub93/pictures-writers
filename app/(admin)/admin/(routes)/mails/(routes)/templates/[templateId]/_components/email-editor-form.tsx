"use client";

import { useRef } from "react";
import { EmailTemplate } from "@prisma/client";
import dynamic from "next/dynamic";
import { EditorRef, EmailEditorProps } from "react-email-editor";
import { EmailTemplateActions } from "./actions";
import axios from "axios";

interface EmailEditorForm {
  template: EmailTemplate;
}

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

export const EmailEditorForm = ({ template }: EmailEditorForm) => {
  const emailEditorRef = useRef<EditorRef>(null);

  const saveDesign = async () => {
    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.saveDesign(async (design) => {
      await axios.patch(`/api/mails/templates/${template.id}`, {
        templateData: design,
      });
    });
  };

  const exportHtml = () => {
    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.exportHtml((data) => {
      const { design, html } = data;
    });
  };

  const onLoad: EmailEditorProps["onLoad"] = (editor) => {
    // editor instance is created
    // you can load your template here;
    // const templateJson = {};
    if (!emailEditorRef?.current?.editor) return;
    console.log(template.templateData)
    emailEditorRef.current.editor.loadDesign(template.templateData);
  };

  const onReady: EmailEditorProps["onReady"] = (editor) => {
    // editor is ready
    // @ts-ignore
    emailEditorRef.current = { editor };
    if (!emailEditorRef?.current?.editor) return;
    console.log(template.templateData)
    emailEditorRef.current.editor.loadDesign(template.templateData);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Email template setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            {/* Complete all fields {completionText} */}
          </span>
          <EmailTemplateActions templateId={template.id} onSave={saveDesign} />
        </div>
      </div>
      <EmailEditor ref={emailEditorRef} onReady={onReady} onLoad={onLoad} />
    </div>
  );
};
