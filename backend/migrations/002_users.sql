-- Users, plus the foreign keys that 001 could not declare because there was
-- nothing to point at yet.

CREATE TABLE public.users (
    -- text rather than bigint, to match notes.user_id and the client-generated
    -- text ids used everywhere else. Server-generated here, since a client must
    -- not get to pick its own user id.
    id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email         text NOT NULL,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive: nobody expects Angel@example.com and angel@example.com to
-- be two accounts. Signup should look up by lower(email) to match this index.
CREATE UNIQUE INDEX users_email_key ON public.users (lower(email));

-- Deleting an account takes its notes and preferences with it. Both tables are
-- empty today, so these validate immediately.
ALTER TABLE public.notes
    ADD CONSTRAINT notes_user_fk
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.user_data
    ADD CONSTRAINT user_data_user_fk
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
