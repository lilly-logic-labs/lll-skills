# SQL stores: Postgres, MySQL and MariaDB, SQLite

Every command below is run against a scratch target after `node scripts/drill.mjs guard` has allowed it. Read-only commands against the source (a dump, a listing, a snapshot copy) need the owner's go-ahead for production. Use a throwaway container as the scratch server when nothing else is available, for example `docker run --rm -d --name drill-db -e POSTGRES_PASSWORD=drill -p 55432:5432 postgres:<same major as source>`.

Contents: Postgres · MySQL and MariaDB · SQLite · Managed providers · Windows notes

## Postgres

Backup kinds and what each proves:

| Kind | Tools | Gives you | Gap |
|---|---|---|---|
| Logical dump | `pg_dump -Fc`, `pg_dumpall --globals-only` | portable, per database, restores into newer versions | no point-in-time; roles come from the globals dump |
| Physical base backup plus WAL | `pg_basebackup`, pgBackRest, WAL-G, Barman | point-in-time recovery | same major version; WAL gaps break recovery |
| Provider snapshots and PITR | RDS, Aurora, Cloud SQL, Azure, Neon, Crunchy, Supabase | managed, usually restore to a new instance | plan tier, retention, region |

Logical restore drill:

```
pg_restore --list backup.dump | head -40                 # table of contents readable? extensions listed?
createdb -h <scratch> drill_restore
pg_restore -h <scratch> -d drill_restore --exit-on-error --jobs 4 backup.dump
psql -h <scratch> -d drill_restore -c '\dt+'              # sizes, tables present
```

- Run once without `--no-owner`/`--no-privileges` to expose missing roles (the globals dump must be restored first: `psql -f globals.sql`). Rerun with them only to proceed, and record the missing roles as a finding.
- Plain SQL dumps: `psql -v ON_ERROR_STOP=1 -f dump.sql`. A silent partial restore is the classic failure.
- Same or newer major version than the source; check `pg_restore -l` for extensions the scratch server must have installed (`postgis`, `pg_trgm`, `vector`, `uuid-ossp`).

Point-in-time recovery drill (self-managed): restore the base backup into an empty data directory, set `restore_command` to fetch archived WAL and `recovery_target_time = '<timestamp>'`, create `recovery.signal`, start, wait for "recovery stopping", then `select pg_wal_replay_resume()` if it paused. With pgBackRest: `pgbackrest --stanza=<name> --type=time "--target=<timestamp>" restore`. With WAL-G: `wal-g backup-fetch <dir> LATEST`, then configure recovery as above. The achieved RPO is the gap between the target time and the newest WAL.

Verification queries:

```sql
-- exact row counts for every table, one result set (emit as TSV with psql -At -F $'\t')
select table_schema||'.'||table_name,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint
from information_schema.tables
where table_type = 'BASE TABLE' and table_schema not in ('pg_catalog','information_schema') order by 1;
-- order-independent checksum of one table (small or mid-sized tables)
select md5(string_agg(md5(t::text), '' order by md5(t::text))) from <schema>.<table> t;
-- sequences behind their tables?
select schemaname||'.'||sequencename, last_value from pg_sequences;
-- policies, triggers, extensions came across?
select count(*) from pg_policies;  select count(*) from pg_trigger where not tgisinternal;  select extname from pg_extension;
```

Gotchas: sequences restored lower than `max(id)`; row-level security policies and grants lost with `--no-privileges`; large objects; partitioned tables; publications and replication slots that now point at the wrong place; `statement_timeout` or `lock_timeout` settings in the dump header; time zone and collation differences between servers; connection strings in the app still pointing at production (run the guard against the app's environment too).

## MySQL and MariaDB

| Kind | Tools | Notes |
|---|---|---|
| Logical dump | `mysqldump --single-transaction --routines --triggers --events --set-gtid-purged=OFF --databases <db>`; `mydumper`/`myloader` for large data | InnoDB only for `--single-transaction`; MyISAM needs locks |
| Physical | Percona XtraBackup, `mariabackup` (`--backup`, then `--prepare`, then `--copy-back` into an empty datadir) | fastest for large data; same major version |
| Point-in-time | full backup plus binary logs: `mysqlbinlog --start-position=<n> --stop-datetime="<ts>" binlog.000123 \| mysql` | binary logging must be on and retained |
| Managed | RDS and Aurora snapshots and PITR, Cloud SQL backups and clones, Azure, PlanetScale | restore creates a new instance or branch; never restore onto the live one |

Restore drill: start a scratch server of the same major version, `mysql -h <scratch> < dump.sql`, then verify:

```
for t in $(mysql -N -e "show tables" <db>); do printf '%s\t%s\n' "$t" "$(mysql -N -e "select count(*) from \`$t\`" <db>)"; done
mysql -e "checksum table <t1>, <t2>" <db>        # compare with the same on a source snapshot
```

Gotchas: `DEFINER` users on views, routines and triggers that do not exist on the scratch server; `sql_mode`, character set and collation drift; users and grants live in the `mysql` schema and are not in a per-database dump (`SHOW GRANTS`); the event scheduler will run restored events on the scratch server, so set `event_scheduler=OFF` first; time zone tables; GTID settings.

## SQLite files

- Never `cp` a live database that uses WAL mode without its `-wal` and `-shm` files. Use the online backup: `sqlite3 app.db ".backup 'backup.db'"` or `sqlite3 app.db "VACUUM INTO 'backup.db'"` (SQLite 3.27 or later).
- Continuous replication: Litestream. Drill: `litestream restore -o restored.db <replica-url>` (add `-timestamp <rfc3339>` for a point in time), then open the file with the app's SQLite version.
- Verify: `PRAGMA integrity_check;` returns `ok`; `PRAGMA foreign_key_check;` returns nothing; per-table counts with a loop over `select name from sqlite_master where type='table' and name not like 'sqlite_%'`; compare `sqlite3 a.db .dump | sha256sum` with the same on the source snapshot for a whole-database checksum.
- Encrypted databases (SQLCipher) need the key, which must be backed up and stored apart from the database file.
- Embedded databases inside apps: see the mobile and on-device notes.

## Managed providers

Restore creates a new resource in every provider; if a console button says "restore" onto the existing instance, it overwrites it, so use the new-instance path for drills.

- AWS RDS and Aurora: `aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier <src> --target-db-instance-identifier drill-<name> --restore-time <iso>` or `restore-db-instance-from-snapshot`. Check automated-backup retention, deletion protection, snapshot copies in another region and account, and whether the KMS key is available in the restore account.
- Google Cloud SQL: `gcloud sql instances clone <src> <drill-target> --point-in-time <iso>`; `gcloud sql backups restore <id> --restore-instance=<target> --backup-instance=<src>` restores onto the named target, so double-check that target is the scratch instance.
- Azure Database: point-in-time restore creates a new server.
- Neon: restore to a branch from a past point; PlanetScale: restore a backup into a new branch or database.
- Always check: retention days against the RPO, PITR enabled, the plan tier that includes it, a copy outside the primary account or region, alerts on failed backups, and the time to restore at your data size (provider restores of large databases take hours).

## Windows notes

Install the client tools (`pg_dump`, `mysqldump`, `sqlite3`) or run them through Docker. In Git Bash use the POSIX loops above; in PowerShell, replace shell loops with `foreach ($t in ...)`. Quote connection strings; do not paste passwords into logs, use `PGPASSWORD`/`MYSQL_PWD` environment variables or a `.pgpass`-style file, and remove them after the drill.
