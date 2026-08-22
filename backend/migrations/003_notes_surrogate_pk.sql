-- note_id is generated on the client, so it is not safe as a primary key: two
-- devices can independently mint the same id. Worse, the old PK made that
-- collision cross-user, since a global unique on note_id means one user's push
-- lands on another user's row.
--
-- So: a surrogate key that only the database ever assigns, and scope the client
-- id to its owner. note_id stays the id the client knows and syncs by; nothing
-- outside this file needs to read the new column.

ALTER TABLE public.notes
    ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY;

ALTER TABLE public.notes DROP CONSTRAINT notes_pkey;
ALTER TABLE public.notes ADD CONSTRAINT notes_pkey PRIMARY KEY (id);

-- The uniqueness that actually matters, and the conflict target the sync
-- upsert now uses. Also serves the single-note read, which is already keyed by
-- (user_id, note_id).
ALTER TABLE public.notes
    ADD CONSTRAINT notes_user_note_key UNIQUE (user_id, note_id);
