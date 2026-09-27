# ADR: Location-aware content

**Status:** accepted (Option B, 10 km first radius) — implemented on `feat/location-aware-feed`
**Date:** 2026-09-10

---

## Context

The feed should be relevant to where the user is, and a header switcher should
re-scope it instantly, for signed-in users and guests alike.

You framed this as *"multitenant, location = tenant"* and asked me to evaluate
that rather than implement it literally. This ADR does that.

### What already exists (verified, not assumed)

This matters more than anything else here, because it changes the cost:

| Thing | Where |
|---|---|
| **`Seller.shop_latitude` / `shop_longitude`** | `app/users/models.py:307-308` |
| `Market` + `Area` with lat/lng | `app/markets/models.py:25-43` |
| `MarketService.resolve_area_for_coordinates` | already used at checkout |
| `ShippingAddress` lat/lng | `app/users/models.py:373-374` |
| Delivery lat/lng | `app/deliveries/models.py:86-87` |

**Sellers already carry a shop location.** Products join to sellers. So
"attach a location to sellable content" is largely *a join we aren't doing yet*,
not a column we need everywhere.

### The constraint that decides the design

**PostGIS is not available.** Verified on the live instance:

```
db: PostgreSQL 16.15
postgis available: False   installed: False
```

I do not know whether production has it. **This is blocker #1** — but the
recommendation below is deliberately chosen so the answer doesn't block the
build.

---

## Options

### Option A — Location as tenant (strict isolation)

Content belongs to a locality; you see that locality's inventory and no other.

- **For:** trivially simple queries; hard data boundaries; matches "multitenant".
- **Against:** **it walls off inventory, and thin inventory kills marketplaces.**
  A buyer in Akobo who'd happily buy from Bodija — fifteen minutes away — sees
  an empty app. A seller who ships nationwide is invisible outside one LGA. And
  every new area launches empty, which is exactly when a marketplace is most
  fragile.
- **Also:** localities have no natural boundaries. Where does "Ibadan" stop?
  Any answer is arbitrary and someone lives on the wrong side of it.

### Option B — Geo-proximity scoping with a relevance ladder ✅ **recommended**

Content has a point. A **browse location** has a point. Results are ranked by
distance with a widening fallback, so the app is never empty.

- **For:** no artificial walls; degrades gracefully in thin areas; a
  nationwide seller stays reachable; the browse location is just a preference,
  so guests get it free.
- **Against:** ranking is more complex than a `WHERE tenant_id = ?`; needs
  thought about index and pagination stability.

### Recommendation

**Option B.** Option A optimises for query simplicity and pays for it with
empty screens, which is the one thing a young marketplace cannot afford. Nothing
in Markt today requires hard isolation — I looked; there's no compliance or
settlement boundary that needs it.

If a hyperlocal-only requirement appears later, B narrows into A by shrinking
the radius. **A cannot widen into B** without re-modelling.

---

## The design

### Distance without PostGIS

Two-stage, which is standard and fast enough well past the scale Markt is at:

1. **Bounding-box prefilter** on a plain B-tree composite index over
   `(latitude, longitude)`. Cheap, index-only, discards most rows.
2. **Haversine ranking** on what survives — arithmetic on a small set.

```sql
WHERE latitude  BETWEEN :lat_min AND :lat_max      -- index
  AND longitude BETWEEN :lng_min AND :lng_max
ORDER BY <haversine>                                -- small set
```

The box is computed per request from the radius (latitude degrees are constant;
longitude degrees scale by `cos(lat)`).

**If production has PostGIS**, the same interface swaps to `ST_DWithin` +
a GIST index with no caller change — the distance function lives behind one
service method precisely so this is a swap, not a rewrite. **Not blocked
either way.**

### Browse location ≠ shipping address

Explicitly separate, in code and UI — Chowdeck lets you change where you're
browsing without touching your saved address, and conflating them means
"look at what's in Lagos" silently redirects your deliveries.

| | Browse location | Shipping address |
|---|---|---|
| Purpose | what you see | where it goes |
| Precision | neighbourhood | exact, with landmark |
| Lives in | new `browse_location` (per user *and* per guest session) | existing `ShippingAddress` |
| Guests | yes | no |

### The fallback ladder

Never show an empty feed because of geography:

1. Within **10 km** of the browse location
2. Widen to **50 km**
3. Widen to **200 km**
4. **Nationwide**, newest first

> **Changed during implementation.** Rung 3 was "the state". `Seller` has no
> state column — the state lives inside a JSON `shop_address` — so that rung
> would have meant an unindexed JSON filter or a new column plus a backfill.
> 200 km covers a Nigerian state in practice (most are 100–300 km across) using
> the same indexed path. Revisit if something needs true administrative
> boundaries.

The response says which rung it used, so the UI can be honest —
*"Nothing within 10 km — showing results from across Oyo"* — rather than
silently pretending everything nearby is 200 km away.

### Pagination

Keyset on `(distance_bucket, id)`, not `OFFSET`. Distance ranking with `OFFSET`
duplicates and drops rows whenever anything changes underneath, and the browse
location changing mid-scroll is a *normal* event here, not an edge case.

---

## Migration and backfill

1. Add `latitude` / `longitude` / `geohash` to products, denormalised from the
   seller's shop at creation — a join per feed row is the thing that gets slow.
2. Composite index `(latitude, longitude)`; a `geohash` prefix index if
   measurement later says the box scan needs it.
3. Backfill from `Seller.shop_latitude/longitude` — **most sellers already have
   one.** Those that don't are geocoded from their address, and any that can't
   be resolved fall to the nationwide rung rather than disappearing.
4. `browse_location` table keyed by user id **or** a guest device id.

---

## What I need from you

1. **Does production have PostGIS?** Doesn't block the build; does decide
   whether stage 2 is Haversine or `ST_DWithin`.
2. **A Google Maps/Places key** with Geocoding + Places and billing enabled —
   needed for map-first addressing and to fix the LGA mis-map properly.
3. **Sign-off on Option B.**
4. **Default radius:** I propose **10 km** for the first rung. It's a guess
   calibrated to Ibadan/Lagos density and should be revisited with real data.
