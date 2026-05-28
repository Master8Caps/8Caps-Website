"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Container } from "@/components/layout/Container";
import { ADMIN_HOST } from "@/lib/host-routing";
import { adminPath, type AdminBasePath } from "@/lib/admin-paths";

function clientBasePath(): AdminBasePath {
  if (typeof window === "undefined") return "/admin";
  return window.location.hostname.toLowerCase() === ADMIN_HOST ? "" : "/admin";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Incorrect email or password.");
      setPending(false);
      return;
    }
    router.push(adminPath(clientBasePath(), "/"));
    router.refresh();
  }

  return (
    <section className="band-surface flex min-h-screen items-center py-16 text-white">
      <Container className="max-w-sm">
        <h1 className="text-2xl font-bold">8Caps Admin</h1>
        <p className="mt-1 text-sm text-white/60">Sign in to manage the directory.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:brightness-110 hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </Container>
    </section>
  );
}
