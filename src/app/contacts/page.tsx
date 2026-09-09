"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ContactsView } from "@/components/contacts-view";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";

export default function ContactsPage() {
  const { status, user, signOut } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") router.replace("/sign-in");
  }, [status, router]);

  if (status !== "signed-in") {
    return (
      <main className="grid min-h-svh place-items-center p-6">
        <p className="text-muted-foreground text-sm" role="status">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">
              Networking Tracker
            </h1>
            <p className="text-muted-foreground truncate text-xs">
              {user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              router.replace("/sign-in");
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <ContactsView />
      </main>
    </div>
  );
}
