# SnapShare — Scaling Plan

## 1. Assumptions

- 10 million registered users.
- 10% of registered users are active each day → 1,000,000 daily active users (DAU).
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- Average photo size = 2 MB.
- Average thumbnail size = 50 KB (0.05 MB) per photo.
- Peak traffic is taken as 5× the average.
- 1 day = 86,400 seconds.
- Feed page = one scrollable screen of photos (treated as one "feed view").

### Daily Active Users (DAU)

DAU = 10,000,000 × 10% = 1,000,000 users

---

## 2. Estimates

### Uploads per second (average)

Photos/day = 1,000,000 users × 1 photo = 1,000,000 photos/day
Uploads/sec = 1,000,000 / 86,400 ≈ 11.6 uploads/sec (~12/sec)

### Feed views per second (average)

Feed views/day = 1,000,000 users × 50 = 50,000,000 views/day
Avg views/sec = 50,000,000 / 86,400 ≈ 579 views/sec (~580/sec)

### Feed views per second (peak, 5×)

Peak views/sec = 579 × 5 ≈ 2,895 views/sec (~2,900/sec)

### Uploads per second (peak, 5×)

Peak uploads/sec = 12 × 5 ≈ 58 uploads/sec

### Photo storage per year

Photos/year = 1,000,000 × 365 = 365,000,000 photos
Full photos/year = 365,000,000 × 2 MB = 730,000,000 MB ≈ 730 TB
Thumbnails/year = 365,000,000 × 0.05 MB = 18,250,000 MB ≈ 18.25 TB
Total/year ≈ 730 TB + 18.25 TB ≈ 748 TB/year (~0.75 PB/year)

---

## 3. Read-Heavy or Write-Heavy?

The system is read-heavy.

- Reads (feed views): ~580/sec average, ~2,900/sec peak.
- Writes (uploads): ~12/sec average, ~58/sec peak.
- Read:write ratio ≈ 50:1.

What this means for design: the read path must be optimized first. We use a CDN and cache to serve feed content and photos, and a read replica to offload reads from the primary database. The write path (uploads) is far lighter, so it can be handled by the primary database plus a queue/worker for background processing without becoming a bottleneck.

---

## 4. Why Photos Should Not Be Stored in the Database

Photos are large binary blobs (2 MB each, ~730 TB/year). Storing them inside the database would bloat tables, slow queries, waste expensive DB storage, and make backups and replication impractical. Instead, photos go to object storage (e.g., S3-compatible storage), which is cheap, durable, and horizontally scalable; the database only stores metadata (photo ID, user ID, URL/key, timestamp).

---

## 5. Architecture (Text Diagram)

                         ┌──────────────┐
                         │    Users     │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │     CDN      │  (serves photos & thumbnails)
                         └──────┬───────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │   Load Balancer    │
                     └─────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐   ┌────────────┐
       │ App Server │   │ App Server │   │ App Server │
       └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
             │                │                │
             ├────────────────┼────────────────┤
             ▼                ▼                ▼
       ┌──────────┐     ┌───────────┐    ┌──────────────┐
       │  Cache   │     │ Database  │◄───│ Read Replica │
       │ (Redis)  │     │ (Primary) │    └──────────────┘
       └──────────┘     └─────┬─────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Queue     │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐      ┌────────────────┐
                       │  Worker     │─────▶│ Object Storage │
                       │ (thumbnails)│      │  (photos)      │
                       └─────────────┘      └────────────────┘

---

## 6. Component Explanations (One Sentence Each)

- CDN — Caches and serves photos/thumbnails from edge locations close to users, reducing latency and origin load.
- Load Balancer — Distributes incoming traffic across multiple app servers so no single server is overwhelmed.
- App Servers — Run the application logic for uploading photos, serving feeds, and coordinating with cache, DB, and queue.
- Cache (Redis) — Stores hot feed data and metadata in memory so repeated reads don't hit the database.
- Database (Primary) — Stores authoritative metadata (users, follows, photo records) and handles all writes.
- Read Replica — Serves read queries (feed lookups) to offload the primary database.
- Object Storage — Stores the actual photo files and thumbnails cheaply and durably at scale.
- Queue — Buffers thumbnail-generation jobs so uploads return fast without blocking on image processing.
- Worker — Consumes queue jobs, generates thumbnails, and writes them to object storage.

---

## 7. Upload Flow (Step by Step)

1. User selects a photo in the app and taps upload.
2. The client requests an upload URL from an app server (via the load balancer).
3. The app server returns a pre-signed URL pointing to object storage.
4. The client uploads the original 2 MB photo directly to object storage (bypassing the app servers).
5. The client notifies the app server that the upload is complete.
6. The app server writes a photo metadata row (photo ID, user ID, storage key, timestamp) to the primary database.
7. The app server enqueues a thumbnail job onto the queue containing the photo ID and storage key.
8. A worker picks up the job, downloads the original, generates a 50 KB thumbnail, and uploads it to object storage.
9. The worker updates the photo record with the thumbnail key (via the primary DB).
10. The photo (and thumbnail) become available; feed reads hit the cache, read replica, and CDN for fast delivery.

---

## 8. Trade-offs

1. CDN + cache vs. consistency — Serving photos and feeds from CDN/cache makes reads fast and cheap, but users may briefly see stale feed content after a new upload; we accept eventual consistency for speed.
2. Direct-to-object-storage uploads vs. app-server uploads — Uploading straight to object storage keeps app servers light and scalable, but it complicates validation (size/type checks must happen via pre-signed URL policies or post-upload checks).
3. Queue + async thumbnails vs. synchronous processing — Async thumbnails make uploads feel instant, but thumbnails appear a few seconds later and the system must handle failed/retried jobs.
4. Read replica vs. strong read consistency — The replica offloads read traffic, but replication lag can cause a user to momentarily miss their own just-uploaded photo in their feed.
