-- Initial schema. Mirrors the client's document-oriented local cache:
-- one row per note (client/src/lib/storage/localCache.ts), categories as a
-- single blob per user, so sync pushes and pulls whole documents.

CREATE TABLE public.notes (
    note_id      text PRIMARY KEY,
    user_id      text NOT NULL,
    title        text NOT NULL DEFAULT '',
    content      text NOT NULL DEFAULT '',
    category_ids text[] NOT NULL DEFAULT '{}',
    excerpt      text NOT NULL DEFAULT '',
    is_pinned    boolean NOT NULL DEFAULT false,

    -- Client-generated, and deliberately without a DEFAULT: these drive
    -- last-write-wins, so a push that omits them should fail loudly rather
    -- than silently resolve to now() and win every conflict.
    created_at   timestamptz NOT NULL,
    updated_at   timestamptz NOT NULL,

    -- Tombstone. Deletes have to survive as a record, or a device that never
    -- saw the delete just pushes the note back on its next sync.
    deleted_at   timestamptz,

    -- Server-assigned pull cursor. Separate from updated_at because client
    -- clocks skew: a device running slow writes a row that sorts behind a
    -- cursor already passed, and that row would never be pulled.
    server_seq   bigint NOT NULL
);

CREATE SEQUENCE public.notes_server_seq OWNED BY public.notes.server_seq;

-- A trigger rather than a DEFAULT/bigserial: those only fire on INSERT, so an
-- upserted note would keep its original seq and stay invisible to any client
-- whose cursor was already past it.
CREATE FUNCTION public.bump_notes_server_seq() RETURNS trigger AS $$
BEGIN
    NEW.server_seq := nextval('public.notes_server_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_bump_server_seq
    BEFORE INSERT OR UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.bump_notes_server_seq();

-- Serves the only hot query: "everything for this user since cursor N".
CREATE INDEX notes_sync_idx ON public.notes (user_id, server_seq);


-- Mirrors Dexie's `user_data` store. Categories live here under
-- key = 'categories', matching saveCategories() writing the whole list at once.
CREATE TABLE public.user_data (
    user_id    text NOT NULL,
    key        text NOT NULL,
    data       jsonb NOT NULL,
    updated_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, key)
);
