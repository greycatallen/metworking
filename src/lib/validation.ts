/**
 * Shared contact validation.
 *
 * This module is a *convenience* layer, not the security boundary. It exists so
 * the UI can show a specific message next to the offending field instead of
 * waiting for a round trip. The authoritative rules are the CHECK constraints in
 * db/migrations/0001_init.sql, which a client cannot skip:
 *
 *   contacts_name_not_blank   length(trim(name)) > 0
 *   contacts_name_max_len     length(name) <= 200
 *   contacts_priority_valid   priority IN ('high','medium','low')
 *
 * The rules below mirror those exactly. If they ever drift, the database wins
 * and the request fails safely — which is the property we actually want.
 */

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const NAME_MAX_LENGTH = 200;

export function isPriority(value: unknown): value is Priority {
  return (
    typeof value === "string" && (PRIORITIES as readonly string[]).includes(value)
  );
}

/** Raw values as they come off the form, before validation. */
export interface ContactInput {
  name?: unknown;
  company?: unknown;
  role?: unknown;
  met_at?: unknown;
  notes?: unknown;
  priority?: unknown;
}

/** A validated payload, shaped for the Data API. */
export interface ContactPayload {
  name: string;
  company: string | null;
  role: string | null;
  met_at: string | null;
  notes: string | null;
  priority: Priority;
}

export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export type ValidationResult =
  | { ok: true; value: ContactPayload }
  | { ok: false; errors: FieldErrors };

/** Trim a free-text field; treat blank as "not provided". */
function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateContact(input: ContactInput): ValidationResult {
  const errors: FieldErrors = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  // Priority is a closed set. An absent value is not defaulted here on purpose:
  // silently coercing unknown input hides bugs, and the form always sends one.
  const priority = input.priority;
  if (!isPriority(priority)) {
    errors.priority = "Priority must be high, medium, or low.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      company: optionalText(input.company),
      role: optionalText(input.role),
      met_at: optionalText(input.met_at),
      notes: optionalText(input.notes),
      priority: priority as Priority,
    },
  };
}
