"use client";

import { ArrowDownUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ContactDialog } from "@/components/contact-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteContact,
  listContacts,
  SORT_OPTIONS,
  type Contact,
  type ListOptions,
  type SortKey,
} from "@/lib/contacts";
import { PRIORITIES, type Priority } from "@/lib/validation";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready" };

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  medium:
    "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  low: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge className={`capitalize ${PRIORITY_STYLES[priority]}`}>
      {priority}
    </Badge>
  );
}

export function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<SortKey>("priority");
  const [ascending, setAscending] = useState<boolean>(
    SORT_OPTIONS.priority.defaultAscending,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Keep typing responsive without firing a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    const options: ListOptions = {
      sort,
      ascending,
      priority,
      search: debouncedSearch,
    };
    try {
      const rows = await listContacts(options);
      setContacts(rows);
      setState({ kind: "ready" });
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Could not load your contacts.",
      });
    }
  }, [sort, ascending, priority, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteContact(pendingDelete.id);
      toast.success("Contact deleted");
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete that contact.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const filtersActive = debouncedSearch.trim() !== "" || priority !== "all";

  return (
    <div className="grid gap-5">
      {/* Toolbar */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search name, company, role, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search contacts"
          />
        </div>
        <Button onClick={openCreate} className="sm:w-auto">
          <Plus /> Add contact
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="filter-priority" className="text-xs">
            Priority
          </Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as Priority | "all")}
          >
            <SelectTrigger id="filter-priority" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="sort-by" className="text-xs">
            Sort by
          </Label>
          <Select
            value={sort}
            onValueChange={(v) => {
              const key = v as SortKey;
              setSort(key);
              setAscending(SORT_OPTIONS[key].defaultAscending);
            }}
          >
            <SelectTrigger id="sort-by" className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_OPTIONS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => setAscending((v) => !v)}
          aria-label={`Sort ${ascending ? "descending" : "ascending"}`}
        >
          <ArrowDownUp />
          {ascending ? "Asc" : "Desc"}
        </Button>
      </div>

      {/* States */}
      {state.kind === "loading" && (
        <p className="text-muted-foreground py-10 text-center text-sm" role="status">
          Loading your contacts…
        </p>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 grid gap-3 rounded-lg border p-6 text-center"
        >
          <p className="text-destructive text-sm">{state.message}</p>
          <div>
            <Button variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {state.kind === "ready" && contacts.length === 0 && (
        <div className="bg-muted/30 grid gap-3 rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">
            {filtersActive ? "No contacts match those filters" : "No contacts yet"}
          </p>
          <p className="text-muted-foreground text-sm">
            {filtersActive
              ? "Try a different search or priority."
              : "Add the first person you want to stay connected with."}
          </p>
          {!filtersActive && (
            <div>
              <Button onClick={openCreate}>
                <Plus /> Add contact
              </Button>
            </div>
          )}
        </div>
      )}

      {state.kind === "ready" && contacts.length > 0 && (
        <>
          <p className="text-muted-foreground text-sm">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </p>

          {/* Desktop: table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Where you met</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="w-[1%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name}
                      {contact.notes && (
                        <span className="text-muted-foreground block text-xs font-normal">
                          {contact.notes}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{contact.company ?? "—"}</TableCell>
                    <TableCell>{contact.role ?? "—"}</TableCell>
                    <TableCell>{contact.met_at ?? "—"}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={contact.priority} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(contact)}
                        aria-label={`Edit ${contact.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(contact)}
                        aria-label={`Delete ${contact.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <ul className="grid gap-3 md:hidden">
            {contacts.map((contact) => (
              <li key={contact.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {[contact.role, contact.company]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <PriorityBadge priority={contact.priority} />
                </div>

                {contact.met_at && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Met at {contact.met_at}
                  </p>
                )}
                {contact.notes && <p className="mt-2 text-sm">{contact.notes}</p>}

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(contact)}
                  >
                    <Pencil /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingDelete(contact)}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editing}
        onSaved={() => void load()}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete contact?</DialogTitle>
            <DialogDescription>
              This permanently removes {pendingDelete?.name} from your list. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
