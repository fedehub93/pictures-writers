"use client";

import { redirect } from "next/navigation";
import Link from "next/link";
import { FileIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { GetFormSubmissionByIdReturn } from "@/data/form";
import { formatBytes, formatDate } from "@/lib/format";

interface SubmissionFormProps {
  initialData: GetFormSubmissionByIdReturn;
}

export const SubmissionForm = ({ initialData }: SubmissionFormProps) => {
  if (!initialData || !initialData.id) {
    return redirect("/admin/forms");
  }

  const jsonFields = JSON.parse(initialData.form.fields as string);
  const submissionData = initialData.data as Record<string, any>;

  return (
    <div className="p-6 max-w-5xl mx-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Form submission</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 h-full">
        {/* MAIN CONTENT */}
        <div className="col-span-full md:col-span-4 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submitted fields</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-y-6">
              {jsonFields.map((field: any) => {
                const value = submissionData[field.name];

                switch (field.type) {
                  case "text":
                    return (
                      <div key={field.name} className="flex flex-col gap-y-2">
                        <Label>{field.label}</Label>
                        <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-line">
                          {value || <span className="italic">—</span>}
                        </div>
                      </div>
                    );

                  case "textarea":
                    return (
                      <div key={field.name} className="flex flex-col gap-y-2">
                        <Label>{field.label}</Label>
                        <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-line min-h-20">
                          {value || <span className="italic">—</span>}
                        </div>
                      </div>
                    );

                  case "file":
                    return (
                      <div key={field.name} className="flex flex-col gap-y-2">
                        <Label>{field.label}</Label>
                        {Array.isArray(value) && value.length > 0 ? (
                          <div className="flex flex-col gap-y-1">
                            {value.map((file: any, idx: number) => (
                              <Link
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-x-2 text-sm hover:underline"
                              >
                                <FileIcon className="size-4 text-primary" />
                                {file.name}{" "}
                                {file.size && (
                                  <span className="text-muted-foreground text-xs">
                                    ({formatBytes(file.size)})
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No files uploaded
                          </p>
                        )}
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>ID:</strong> {initialData.id}
              </p>
              {initialData.form?.name && (
                <p>
                  <strong>Form:</strong> {initialData.form.name}
                </p>
              )}
              <p>
                <strong>Created at:</strong>{" "}
                {formatDate({ date: initialData.createdAt })}
              </p>
              {initialData.email && (
                <p>
                  <strong>Email:</strong> {initialData.email}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
