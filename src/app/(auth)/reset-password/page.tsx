"use client";

import "client-only";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); await authClient.resetPassword({ newPassword: password, token }, { onSuccess: () => setDone(true), onError: (ctx) => setError(ctx.error.message) }); };
  return <Card className="w-full max-w-md"><CardHeader><CardTitle>Choose a new password</CardTitle><CardDescription>{done ? "Your password has been updated." : error || "Use at least 8 characters."}</CardDescription></CardHeader><CardContent>{done ? <p>You can close this page and sign in with your new password.</p> : <form className="flex flex-col gap-4" onSubmit={submit}><div className="flex flex-col gap-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><Button type="submit" disabled={!token}>Update password</Button></form>}</CardContent></Card>;
}
