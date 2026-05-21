"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const ContactRequestForm = ({
  name,
  email,
  subject,
  message,
}: {
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
}) => {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex flex-wrap gap-4">
        <div className="min-w-40 flex-auto flex flex-wrap gap-4">
          <div>First Name</div>
          <Input disabled={true} value={name || ""} />
        </div>
        <div className="min-w-40 flex-auto flex flex-wrap gap-4">
          <div>Email</div>
          <Input disabled={true} value={email || ""} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <div>Subject</div>
        <Input disabled={true} value={subject || ""} />
        <div />
      </div>
      <div className="flex flex-wrap gap-4">
        <div>Message</div>
        <Textarea disabled={true} value={message || ""} rows={10} />
      </div>
      <div className="flex items-center gap-x-2 justify-end">
        <Button type="submit">Send</Button>
      </div>
    </div>
  );
};
