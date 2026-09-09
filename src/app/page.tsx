"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "@/components/session-provider";

/**
 * Entry point. Sends signed-in users to their contacts and everyone else to
 * sign-in, without rendering either state while the session is still resolving.
 */
export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-in") router.replace("/contacts");
    if (status === "signed-out") router.replace("/sign-in");
  }, [status, router]);

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <p className="text-muted-foreground text-sm" role="status">
        Loading…
      </p>
    </main>
  );
}
