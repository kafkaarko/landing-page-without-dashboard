-- CONDITIONAL TEMPLATE ONLY. No PostgreSQL was found in this repository.
-- Run only on the owned staging database, after verifying its PostgreSQL version.
-- Read-only monitoring. No query text or user payloads are exported here.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '3s';
SET LOCAL lock_timeout = '500ms';

SELECT now() AS sampled_at, version() AS server_version,
       current_setting('max_connections')::integer AS max_connections;

SELECT state, wait_event_type, count(*) AS connections
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, wait_event_type
ORDER BY connections DESC;

-- Idle connections are not the same as active requests or pool waiters.
SELECT count(*) AS connections_all_databases FROM pg_stat_activity;

SELECT pid, state, wait_event_type, wait_event,
       now() - xact_start AS transaction_age,
       now() - query_start AS query_age,
       pg_blocking_pids(pid) AS blocking_pids
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
  AND (state = 'active' OR state = 'idle in transaction')
ORDER BY xact_start NULLS LAST
LIMIT 30;

SELECT datname, numbackends, xact_commit, xact_rollback,
       deadlocks, temp_files, temp_bytes, blks_read, blks_hit
FROM pg_stat_database
WHERE datname = current_database();

-- Extension availability only; columns vary by installed extension version.
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';

COMMIT;
-- Re-run each snapshot as a new transaction every 5..10 seconds.
-- These are cumulative counters: compare deltas, never reset shared statistics.
-- Application pool used/idle/waiting and pool timeouts need app instrumentation.
