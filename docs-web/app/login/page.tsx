"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FileText } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "alice@example.com", label: "Alice · owner" },
  { email: "bob@example.com", label: "Bob · editor" },
  { email: "carol@example.com", label: "Carol · viewer" },
];

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("password123");

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (user) => {
      qc.setQueryData(["me"], user);
      router.replace("/");
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-accent flex size-9 items-center justify-center rounded-lg text-white">
            <FileText className="size-5" />
          </div>
          <span className="font-serif text-xl font-semibold">Ajaia Docs</span>
        </div>

        <div className="border-line bg-surface rounded-xl border p-6 shadow-sm">
          <h1 className="mb-1 text-lg font-semibold">Sign in</h1>
          <p className="text-ink-soft mb-5 text-sm">Use a seeded demo account below.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {errorMessage && <p className="text-danger text-sm">{errorMessage}</p>}
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner className="text-white" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="border-line mt-5 border-t pt-4">
            <p className="text-ink-soft mb-2 text-xs font-medium tracking-wide uppercase">
              Quick switch
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("password123");
                  }}
                  className="border-line bg-paper text-ink hover:bg-accent-soft rounded-md border px-2.5 py-1 text-xs transition-colors"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
