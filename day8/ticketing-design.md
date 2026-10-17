# TicketHub - Design Document

TicketHub is a website that sells tickets for concerts and events. This document follows the six-part framework: requirements, estimates, API, data model, architecture and trade-offs. It also explains how two people are prevented from buying the same seat.

## 1. Requirements

**Functional**

- Browse and search events.
- See which seats are available for an event.
- Hold seats for 10 minutes while paying.
- Pay and receive tickets.
- View my tickets.

**Non-functional**

- **Correctness:** a seat must NEVER be sold twice. Correctness comes before everything else.
- **Speed:** pages load in under 1 second on normal days; a hold request answers in under 1 second even during a big sale.
- **Scalability:** survive big sales: about 3,300 requests/second for 10 minutes.
- **Fairness:** people who arrive first get the first chance to buy; one person or bot cannot grab the whole venue.
- **Availability:** browsing keeps working even when the booking system is under heavy load.

## 2. Estimates

**Normal day**

- 50,000 visitors x 10 pages = 500,000 page views per day.
- 500,000 / 100,000 seconds (a day rounded) = about **5 requests per second**. Very small.
- 5,000 tickets sold per day = well under 1 purchase per second.
- Reads far outnumber writes: 500,000 page views against 5,000 purchases, about 100 to 1.

**Big sale**

- 200,000 people try to buy 20,000 seats in the first 10 minutes (600 seconds).
- Each person makes about 10 requests (refreshing, choosing seats, paying) = 2,000,000 requests.
- 2,000,000 / 600 = about **3,300 requests per second**.
- Only 20,000 seats exist, so at most 20,000 orders can succeed. 180,000 people will not get a ticket and must be told quickly.

**Comparison**

|                     | Normal day                  | Big sale             |
| ------------------- | --------------------------- | -------------------- |
| Requests per second | about 5                     | about 3,300          |
| Tickets sold        | 5,000 per day               | 20,000 in 10 minutes |
| Shape of traffic    | smooth, spread over the day | sudden spike         |

The big sale is nearly **700 times** the normal traffic (3,300 / 5 = 660), arriving all at once. The real design challenge is not the normal day but this sudden spike, together with the strict rule that a seat can only be sold once.

## 3. API

| Method and path             | Purpose                            | Responses     |
| --------------------------- | ---------------------------------- | ------------- |
| `GET /events?search=&city=` | list and search events             | 200           |
| `GET /events/{id}`          | event details                      | 200, 404      |
| `GET /events/{id}/seats`    | seats with their status            | 200           |
| `POST /holds`               | hold seats                         | 201, 409      |
| `POST /orders`              | pay for a hold and receive tickets | 201, 402, 410 |
| `GET /me/tickets`           | my tickets                         | 200           |

`POST /holds`

```json
{ "eventId": 7, "seatIds": [101, 102] }
```

- 201 Created with `holdId` and the expiry time.
- 409 Conflict if a seat is taken.

`POST /orders`

```json
{ "holdId": 55, "paymentToken": "..." }
```

- 201 Created (tickets issued).
- 410 Gone if the hold has expired. 402 if the payment is declined.

409 Conflict means the request clashes with the current state (the seat is no longer available). Orders are sent with an idempotency key so that a retried request never charges the customer twice.

## 4. Data model

- **users** (id, name, email UNIQUE, password_hash)
- **events** (id, name, venue, starts_at)
- **seats** (id, event_id FK -> events, section, row, number, status: 'available' | 'held' | 'sold', hold_id, hold_expires_at, UNIQUE (event_id, section, row, number))
- **orders** (id, user_id FK -> users, event_id FK -> events, total, status, created_at)
- **order_seats** (order_id FK -> orders, seat_id FK -> seats UNIQUE)

**Relationships:** an event has many seats (one-to-many); a user has many orders (one-to-many); an order contains many seats, and each seat can belong to at most one order. This is enforced by UNIQUE on `order_seats.seat_id`.

## 5. Preventing double-booking

Holding a seat uses a single conditional update inside a transaction:

```sql
BEGIN TRANSACTION;

UPDATE seats
SET status = 'held', hold_id = 55,
    hold_expires_at = NOW() + INTERVAL '10 minutes'
WHERE id IN (101, 102) AND event_id = 7
  AND (status = 'available'
       OR (status = 'held' AND hold_expires_at < NOW()));

-- if fewer than 2 rows changed, someone else got a seat first:
--   ROLLBACK;  and reply 409 Conflict
-- otherwise:
--   COMMIT;    and reply 201 Created
```

Because the database checks the status and changes it in **one atomic step**, two buyers can never both succeed for the same seat: the second update finds the seat already 'held' and changes nothing. The transaction makes the hold all-or-nothing, so a buyer never ends up with only one of two seats.

**Paying** is a second transaction. It marks the seats 'sold' only if they are still held by this buyer's hold, then creates the order:

```sql
BEGIN TRANSACTION;

UPDATE seats SET status = 'sold'
WHERE hold_id = 55 AND status = 'held' AND hold_expires_at > NOW();
-- rows changed must equal the number of seats, otherwise ROLLBACK (and refund)

INSERT INTO orders (...) VALUES (...);
INSERT INTO order_seats (order_id, seat_id) VALUES (...);
COMMIT;
```

**Constraints are the second safety net.** The UNIQUE constraint on `order_seats.seat_id` means the database refuses to attach one seat to two orders, even if there were a bug in the application. UNIQUE on (event_id, section, row, number) stops the same physical seat existing twice.

**Expired holds** become available again automatically, because the WHERE clause treats them like available seats. A buyer who abandons the page does not block the seat for ever.

**Why this is safe under load:** correctness is guaranteed by the database, not by the app servers or the cache. Even if thousands of servers try at the same moment, only one can succeed for each seat.

## 6. Architecture

```
Browser ──> CDN (event pages, images, CSS, JS)
   │
   v
Load balancer ──> Waiting room (virtual queue)
                       │  lets ~2,000 buyers in at a time
                       v
           App servers (auto-scaled for the sale)
             │               │                │
             v               v                v
      Cache (Redis):   Primary DB          Payment provider
      event pages,     (seats, orders -    (external service)
      seat map         all holds and
      (short TTL)      purchases here)
                             │
                             v
                      Read replicas (browsing, search)
                             │
               Queue ──> Workers (ticket emails, PDFs)
```

**Components**

- **CDN:** event pages and images are identical for everyone, so they are served from the edge during the rush. Most of the 3,300 requests per second never reach our servers.
- **Load balancer:** spreads requests across the app servers and removes unhealthy ones.
- **Waiting room:** during a big sale, visitors join a virtual queue and are let in at a rate the system can handle, in arrival order. This protects the database and is fair.
- **Auto-scaled stateless app servers:** extra servers are added before a known big sale and removed afterwards. They hold no seat state, so any server can handle any request.
- **Cache (Redis):** the seat map is cached for a few seconds to absorb millions of views; the final check always happens in the database.
- **Primary database:** the only place seats are held and sold, so the transaction guarantees correctness.
- **Read replicas:** handle browsing and search so the primary can focus on holds and orders.
- **Payment provider:** an external service that charges the card; we store only a payment token, never card numbers.
- **Queue and workers:** ticket emails and PDFs are created in the background after payment, keeping checkout fast.

**How it survives the big sale**

1. Before the sale, servers are scaled up and the event page and seat map are pre-loaded in the cache and CDN.
2. During the rush, the CDN and cache answer almost all page views.
3. The waiting room turns a spike of 200,000 people into a steady stream of about 2,000 buyers at a time, so the primary database only sees a rate it can handle.
4. Each hold is one short, per-row transaction, so it completes in milliseconds. A buyer who loses a seat gets an immediate 409 and picks another.
5. When the last seat is sold, everyone waiting is told "sold out" at once, so 180,000 people stop sending requests.

## 7. Trade-offs

1. **Correctness over availability for purchases.** Holds and orders always go to the primary database, even if that means some buyers wait or see "try again". Selling a seat twice would be far worse.
2. **Freshness vs speed for the seat map.** The cached map may be a few seconds out of date, so a seat that looks free may already be held. The buyer then gets a 409 and picks another seat. This is acceptable, because the final check is always correct.
3. **Fairness vs simplicity.** The waiting room adds complexity, but without it the fastest bots and refreshers would win, and the spike could overload the system.
4. **Hold length vs seat availability.** A 10-minute hold gives people time to pay, but abandoned seats stay locked for up to 10 minutes while others are waiting. Expired holds are reusable immediately to limit this cost.
