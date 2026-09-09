/**
 * Turns Postgres / PostgREST errors into messages a person can act on.
 *
 * The database reports violations by constraint name, so each rule maps to one
 * specific sentence rather than a generic "something went wrong".
 */

interface DataApiError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  contacts_name_not_blank: "Name is required.",
  contacts_name_max_len: "Name must be 200 characters or fewer.",
  contacts_priority_valid: "Priority must be high, medium, or low.",
  contacts_user_id_not_blank: "Could not identify the signed-in user.",
};

export function friendlyError(error: unknown): string {
  const err = (error ?? {}) as DataApiError;
  const message = err.message ?? "";

  // 23514 = check_violation. The constraint name appears in the message text.
  if (err.code === "23514") {
    for (const [constraint, text] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (message.includes(constraint)) return text;
    }
    return "That contact has a value the database rejected.";
  }

  // 42501 = insufficient_privilege, raised by an RLS WITH CHECK failure.
  if (err.code === "42501") {
    return "You can only create or change contacts that belong to you.";
  }

  if (/jwt|token/i.test(message) && /expired|invalid/i.test(message)) {
    return "Your session expired. Please sign in again.";
  }

  if (/authentication credentials/i.test(message)) {
    return "You are signed out. Please sign in again.";
  }

  return message || "Something went wrong. Please try again.";
}
