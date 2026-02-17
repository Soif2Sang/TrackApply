-- PG-Boss job queue schema
-- https://github.com/timgit/pg-boss

CREATE SCHEMA IF NOT EXISTS pgboss;

-- Main job table
CREATE TABLE IF NOT EXISTS pgboss.job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    priority integer DEFAULT 0,
    data jsonb,
    state text DEFAULT 'created'::text,
    retryLimit integer DEFAULT 0,
    retryCount integer DEFAULT 0,
    retryDelay integer DEFAULT 0,
    retryBackoff boolean DEFAULT false,
    startAfter timestamp with time zone DEFAULT now(),
    startedOn timestamp with time zone,
    singletonKey text,
    singletonOn timestamp with time zone,
    expireIn interval DEFAULT '15 minutes'::interval,
    createdOn timestamp with time zone DEFAULT now(),
    completedOn timestamp with time zone,
    keepUntil timestamp with time zone DEFAULT (now() + '14 days'::interval),
    deadLetter text,
    policy text,
    CONSTRAINT job_state_check CHECK (
        state = ANY (ARRAY[
            'created'::text,
            'retry'::text,
            'active'::text,
            'completed'::text,
            'cancelled'::text,
            'failed'::text
        ])
    )
);

-- Archive table for completed/expired jobs
CREATE TABLE IF NOT EXISTS pgboss.archive (
    id uuid NOT NULL,
    name text NOT NULL,
    priority integer,
    data jsonb,
    state text,
    retryLimit integer,
    retryCount integer,
    retryDelay integer,
    retryBackoff boolean,
    startAfter timestamp with time zone,
    startedOn timestamp with time zone,
    singletonKey text,
    singletonOn timestamp with time zone,
    expireIn interval,
    createdOn timestamp with time zone,
    completedOn timestamp with time zone,
    keepUntil timestamp with time zone,
    deadLetter text,
    policy text,
    archivedOn timestamp with time zone DEFAULT now()
);

-- Version table for schema versioning
CREATE TABLE IF NOT EXISTS pgboss.version (
    version integer PRIMARY KEY,
    maintainedOn timestamp with time zone DEFAULT now(),
    cronOn timestamp with time zone
);

-- Insert initial version
INSERT INTO pgboss.version (version) VALUES (22)
ON CONFLICT (version) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS job_name ON pgboss.job (name);
CREATE INDEX IF NOT EXISTS job_state ON pgboss.job (state);
CREATE INDEX IF NOT EXISTS job_startAfter ON pgboss.job (startAfter);
CREATE INDEX IF NOT EXISTS job_singletonKey ON pgboss.job (singletonKey) WHERE singletonKey IS NOT NULL;
CREATE INDEX IF NOT EXISTS job_fetch ON pgboss.job (priority desc, createdOn, id) WHERE state < 'active';
CREATE INDEX IF NOT EXISTS archive_archivedOn ON pgboss.archive (archivedOn);
