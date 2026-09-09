-- 0002_priority_rank.sql — make priority sortable by importance, not alphabet.
--
-- Sorting on `priority` directly gives high, low, medium: alphabetical order,
-- which is meaningless to a user. A STORED generated column lets Postgres do the
-- ordering so every sort in the UI is a real ORDER BY rather than a client-side
-- re-shuffle of one page of rows.
--
-- GENERATED ALWAYS means it cannot be written by a client, so it stays in sync
-- with `priority` by construction and needs no trigger.

ALTER TABLE public.contacts
  ADD COLUMN priority_rank smallint
  GENERATED ALWAYS AS (
    CASE priority
      WHEN 'high'   THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low'    THEN 3
    END
  ) STORED;

-- Supports the default listing: a user's contacts, most important first.
CREATE INDEX contacts_user_id_priority_rank_idx
  ON public.contacts (user_id, priority_rank, created_at DESC);
