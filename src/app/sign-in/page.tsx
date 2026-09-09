"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { neon } from "@/lib/neon";

type Mode = "sign-in" | "sign-up";

export default function SignInPage() {
  const { status, refresh } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "signed-in") router.replace("/contacts");
  }, [status, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const auth = neon().auth;
      const result =
        mode === "sign-up"
          ? await auth.signUp.email({ email, password, name })
          : await auth.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Could not sign you in.");
        return;
      }

      await refresh();
      router.replace("/contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const isSignUp = mode === "sign-up";

  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Networking Tracker
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Keep track of the people you meet at Berkeley.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Create an account" : "Sign in"}</CardTitle>
            <CardDescription>
              {isSignUp
                ? "Your contacts are private to your account."
                : "Welcome back."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4" noValidate>
              {isSignUp && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
                >
                  {error}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting
                  ? "Working…"
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-4 text-center text-sm">
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            className="text-foreground font-medium underline underline-offset-4"
            onClick={() => {
              setMode(isSignUp ? "sign-in" : "sign-up");
              setError(null);
            }}
          >
            {isSignUp ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </main>
  );
}
