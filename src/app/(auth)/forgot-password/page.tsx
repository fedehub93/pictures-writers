"use client";

import "client-only";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); await authClient.requestPasswordReset({ email, redirectTo: "/reset-password/" }, { onSuccess: () => setSent(true), onError: (ctx) => setError(ctx.error.message) }); };
  return <Card className="w-full max-w-md"><CardHeader><CardTitle>Reset your password</CardTitle><CardDescription>{sent ? "If an account exists, a reset link is on its way." : error || "Enter your email address."}</CardDescription></CardHeader><CardContent>{sent ? <Button asChild><Link href="/sign-in">Return to sign in</Link></Button> : <form className="flex flex-col gap-4" onSubmit={submit}><div className="flex flex-col gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><Button type="submit">Send reset link</Button></form>}</CardContent></Card>;
}
