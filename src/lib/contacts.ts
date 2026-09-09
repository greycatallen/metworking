import { neon } from "@/lib/neon";
import { friendlyError } from "@/lib/errors";
import type { ContactPayload, Priority } from "@/lib/validation";

/**
 * Every read and write of `contacts` goes through this module. UI components
 * never talk to the Data API directly, which keeps query construction, error
 * translation, and result shaping in one reviewable place.
 *
 * Note what is absent: no query here filters by user_id. It does not need to.
 * The RLS policies scope every statement to the caller's own rows, so ownership
 * cannot be forgotten at a call site.
 */

export interface Contact {
  id: number;
  user_id: string;
  name: string;
  company: string | null;
  role: string | null;
  met_at: string | null;
  notes: string | null;
  priority: Priority;
  priority_rank: number;
  created_at: string;
  updated_at: string;
}

export const SORT_OPTIONS = {
  priority: { label: "Priority", column: "priority_rank", defaultAscending: true },
  name: { label: "Name", column: "name", defaultAscending: true },
  company: { label: "Company", column: "company", defaultAscending: true },
  created_at: { label: "Date added", column: "created_at", defaultAscending: false },
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export interface ListOptions {
  sort: SortKey;
  ascending: boolean;
  priority: Priority | "all";
  search: string;
}

/**
 * PostgREST's `or=` takes a comma-separated list inside parentheses, so those
 * characters would break out of the intended filter and cause a 400. Values are
 * still sent as parameters (this is not SQL injection), but stripping the
 * syntax characters keeps arbitrary search text from producing a broken query.
 */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()*"\\]/g, " ").replace(/\s+/g, " ").trim();
}

const SEARCHABLE = ["name", "company", "role", "met_at", "notes"] as const;

export class ContactsError extends Error {
  constructor(cause: unknown) {
    super(friendlyError(cause));
    this.name = "ContactsError";
  }
}

export async function listContacts(options: ListOptions): Promise<Contact[]> {
  const { column } = SORT_OPTIONS[options.sort];

  let query = neon().from("contacts").select("*");

  if (options.priority !== "all") {
    query = query.eq("priority", options.priority);
  }

  const term = sanitizeSearch(options.search);
  if (term.length > 0) {
    query = query.or(
      SEARCHABLE.map((field) => `${field}.ilike.*${term}*`).join(","),
    );
  }

  // Secondary key keeps ordering stable when the primary key ties.
  const { data, error } = await query
    .order(column, { ascending: options.ascending })
    .order("id", { ascending: false });

  if (error) throw new ContactsError(error);
  return (data ?? []) as Contact[];
}

export async function createContact(payload: ContactPayload): Promise<Contact> {
  // user_id is deliberately not sent: it defaults to auth.user_id() in Postgres.
  const { data, error } = await neon()
    .from("contacts")
    .insert(payload)
    .select()
    .single();

  if (error) throw new ContactsError(error);
  return data as Contact;
}

export async function updateContact(
  id: number,
  payload: ContactPayload,
): Promise<Contact> {
  const { data, error } = await neon()
    .from("contacts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new ContactsError(error);
  return data as Contact;
}

export async function deleteContact(id: number): Promise<void> {
  const { error } = await neon().from("contacts").delete().eq("id", id);
  if (error) throw new ContactsError(error);
}
