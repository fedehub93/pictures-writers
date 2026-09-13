"use client";

import "client-only";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function InviteForm({ token }: { token: string }) {
  const [details, setDetails] = useState<{ email: string; roleName: string } | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    void fetch(`/api/invitations/${encodeURIComponent(token)}`)
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(setDetails)
      .catch((cause: Error) => setError(cause.message));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, firstName, lastName, bio }) });
    const data = await response.json();
    if (!response.ok) setError(data.error);
    else setDone(true);
  };

  return <Card className="w-full max-w-md"><CardHeader><CardTitle>Activate your account</CardTitle><CardDescription>{error || (details ? `You were invited as ${details.roleName}.` : "Checking your invitation...")}</CardDescription></CardHeader><CardContent>{done ? <div className="flex flex-col gap-4"><p>Your account is ready. You can now sign in.</p><Button asChild><Link href="/sign-in/">Go to sign in</Link></Button></div> : <form className="flex flex-col gap-4" onSubmit={submit}><div className="flex flex-col gap-2"><Label>Email</Label><Input value={details?.email ?? ""} disabled /></div><div className="flex flex-col gap-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="bio">Bio</Label><Input id="bio" value={bio} onChange={(event) => setBio(event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div><Button type="submit" disabled={!details}>Set password and activate</Button></form>}</CardContent></Card>;
}
