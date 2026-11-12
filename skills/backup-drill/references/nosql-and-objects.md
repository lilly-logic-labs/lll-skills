# NoSQL, cache and object storage: MongoDB, Redis, S3 and R2

Contents: MongoDB · Redis · Object storage (S3, R2, GCS, Azure Blob) · Search indexes, queues, files on disk

## MongoDB

| Kind | Tools | Notes |
|---|---|---|
| Logical | `mongodump --uri="<src>" --archive=dump.gz --gzip` then `mongorestore --uri="<scratch>" --archive=dump.gz --gzip` | add `--oplog` and `--oplogReplay` on replica sets for a consistent point; `--nsInclude 'app.*'` to limit |
| Filesystem or volume snapshot | LVM or cloud disk snapshots with journaling on | restore the snapshot to a new volume and start `mongod` on it |
| Managed | Atlas Cloud Backup snapshots and continuous backup (point-in-time) | restore into a new cluster, not the live one |

- `mongorestore --drop` and the Atlas "restore to this cluster" option overwrite data: scratch targets only.
- Indexes are restored with the data unless `--noIndexRestore`; users and roles live in `admin`, so dump and restore them separately if the app needs them.
- Verify: per collection `db.<c>.countDocuments({})` (exact; `estimatedDocumentCount()` is a metadata estimate), `db.<c>.getIndexes().length`, `db.runCommand({ dbHash: 1 })` for per-collection md5 on an idle copy, `db.<c>.validate()` for structural integrity. Count loop in mongosh: `db.getCollectionNames().forEach(n => print(n + "\t" + db[n].countDocuments({})))`.
- Gotchas: capped collections and time-series collections; change streams and resume tokens do not survive; sharded clusters need config servers and a consistent cut across shards; TTL indexes will start deleting restored documents on the scratch server (disable the TTL monitor with `setParameter ttlMonitorEnabled=false` while verifying).

## Redis

First question: is Redis a cache (rebuildable, no backup needed) or a store (sessions, queues, counters, rate limits, leaderboards)? Write the answer down. A replica is not a backup, because a mistaken `FLUSHALL` replicates.

- Persistence: RDB snapshots (`dump.rdb`, `BGSAVE`, schedule in `save` lines), AOF (`appendonly yes`, `appendfsync everysec`), or both. Managed tiers sometimes ship with persistence off; check it.
- Backup: after `BGSAVE` confirm with `LASTSAVE`, copy `dump.rdb`; or pull from a remote server with `redis-cli --rdb out.rdb`. Managed: ElastiCache snapshots restore to a new cluster; Upstash and Redis Cloud have their own backups.
- Restore drill: stop or use a separate scratch `redis-server --port 6390 --dir <scratch dir> --dbfilename dump.rdb --appendonly no` with the file placed in that directory (with AOF on, Redis loads the AOF instead of the RDB). Validate first with `redis-check-rdb dump.rdb` or `redis-check-aof`.
- Verify: `DBSIZE`, `INFO keyspace`, key counts per prefix (`redis-cli --scan --pattern 'session:*' | wc -l`), a sample of keys with `TYPE` and `TTL`, and one real read path from the app.
- Gotchas: expired keys vanish on load; queue libraries (BullMQ, Sidekiq, Celery with Redis) will replay restored jobs, so keep workers off; a restored session store logs everybody in or out depending on secrets; memory sizing of the scratch host.

## Object storage

Applies to S3, Cloudflare R2, Google Cloud Storage, Azure Blob, Backblaze B2, MinIO, Supabase Storage and Firebase Storage.

Protection mechanisms to look for:

| Mechanism | What it protects against | Check |
|---|---|---|
| Versioning (S3, GCS, Azure) | overwrite and delete | `aws s3api get-bucket-versioning --bucket <b>`; lifecycle rules for non-current versions do not expire them too early |
| Object Lock or retention (S3 Object Lock needs versioning; R2 bucket locks; GCS retention policies; Azure immutability) | deletion by mistake or an attacker with write access | rule exists, retention days, governance versus compliance mode |
| Replication to another region or account | regional loss and account loss | replication rule status; delete markers replicate only if configured |
| Separate backup copy (`rclone`, AWS Backup, scheduled job) | everything above failing | copy exists in another account or provider, with write-only credentials |

R2: bucket locks give retention rules by prefix; confirm in the current docs whether bucket versioning exists on your plan. Where it does not, the real backup is a second copy elsewhere (for example `rclone sync r2:<bucket> <other>:<bucket>` on a schedule). R2 speaks the S3 API: `aws s3 ls --endpoint-url https://<account>.r2.cloudflarestorage.com s3://<bucket>`.

Drill recipe, using a dedicated prefix or a scratch bucket (writes to a production bucket need the owner's OK; prefer the scratch bucket):

1. Put a marker object in a `drill/` prefix, then delete it.
2. Recover it: S3 `aws s3api list-object-versions --bucket <b> --prefix drill/` then either remove the delete marker (`aws s3api delete-object --bucket <b> --key <k> --version-id <marker-id>`) or `aws s3api copy-object` from the earlier `versionId`. With a separate backup copy, restore from the copy instead.
3. Restore a representative slice of the real data into a scratch bucket: `aws s3 sync s3://<backup>/<prefix> s3://<scratch>/<prefix>` or `rclone copy <backup>:<bucket>/<prefix> <scratch>:<bucket>/<prefix>`. `rclone sync` deletes extra files at the destination, so only ever point it at the scratch side.
4. Verify: object count and total size (`aws s3 ls --recursive --summarize`), checksums with `rclone check <src> <dst> --one-way` (S3 ETags are not MD5 for multipart uploads; use `--checksum-mode ENABLED` where the object has a stored checksum), open five real files of different types.
5. Check that the app's database rows still resolve to keys that exist: sample `file_url` or `storage_key` values from the restored database and `head-object` them. Database and files must be restorable to the same moment, or the gap must be documented.
6. Delete the scratch bucket.

Gotchas: presigned URLs and CDN caches hide a deleted object for a while; lifecycle rules can purge the old versions you are counting on; MFA delete and Object Lock stop you cleaning the scratch bucket too, so never lock the scratch bucket; bucket policy and CORS configuration are separate from the data (infrastructure code should hold them).

## Search indexes, queues, files on disk

- Elasticsearch and OpenSearch: snapshot repository plus `_snapshot` restore into a scratch cluster; if the index can be rebuilt from the database, the drill is a timed rebuild.
- Message queues with durable messages (SQS, RabbitMQ, Kafka): decide if loss is acceptable; Kafka topic retention is not a backup.
- Files on a server disk or volume: volume snapshots restored to a new disk; check ownership and permissions after restore.
- Secrets, signing keys and encryption keys: the most expensive thing to lose. Confirm they live in a secret manager or password manager with its own recovery, and that someone other than one person can reach them.
