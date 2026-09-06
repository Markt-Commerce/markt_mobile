# Gamification — findings and plan

Phase 0 investigation, 2026-09-06. Written before any code.

---

## 1. What already exists

More than the brief assumes. This is a wiring-and-polish job, not a build from
scratch.

### Mobile surfaces

| Surface | File |
|---|---|
| Your Progress | `app/gamification/index.tsx` |
| Leaderboard | `app/gamification/leaderboard.tsx` |
| Points history | `app/gamification/points-history.tsx` |
| Badge detail | `app/gamification/badge/[slug].tsx` |
| Badge grid / card / chip | `components/gamification/Badge{Grid,Card,Chip}.tsx` |
| Tier badge + progress bar | `components/gamification/Tier{Badge,ProgressBar}.tsx` |
| Leaderboard row + scope tabs | `components/gamification/Leaderboard{Row,ScopeTabs}.tsx` |
| Profile strip | `components/gamification/GamificationStrip.tsx` |
| Feed seedling icon | via `BadgeChip` in the feed cards |

**The realtime plumbing is already done.** `hooks/useGamificationSocket.ts`
dispatches three server events — `PointsAwardedEvent`, `BadgeEarnedEvent`,
`TierChangedEvent` — and `hooks/gamificationContext.tsx` already mounts
`BadgeUnlockModal` and `TierUpAnimationModal` in response.

Both modals are honest placeholders. Their own comments say so:

> Lottie confetti asset is supplied by design; this is the MVP treatment.

They are a `<Modal animationType="fade">` with static content. No spring, no
particles, no haptics, no counting. **So the trigger path exists and works —
what's missing is the feeling.** That is a much better starting point than the
brief assumed, and it means the highest-value work is the celebration system
itself rather than event plumbing.

### Backend model (`app/gamification/`)

| Concern | Where | State |
|---|---|---|
| Points | `PointsLedger` (delta, reason, ref, balance_after) | complete |
| Totals | `UserStats` (lifetime/available/weekly, current_tier) | complete |
| Badges | `Badge` + `UserBadge` (`awarded_at`, `progress_json`) | complete |
| Tiers | `TierConfig` (min_lifetime_points, colour, stars) | complete |
| Tier delta | `tier_engine.tier_progress()` → `progress_to_next`, `points_to_next_tier` | **already exposed** |
| Leaderboard | `LeaderboardSnapshot` + `/leaderboard` → `your_rank {rank, points, out_of}` | complete |

Endpoints: `/me`, `/me/preferences`, `/users/<id>/profile`, `/users/<id>/badges`,
`/points/history`, `/leaderboard`, `/badges`, `/tiers`.

## 2. Gaps that block the brief

Three, and only the first is on the critical path.

1. **No "seen" concept anywhere.** `grep -ri "seen|acknowledg|unseen"` across
   `app/gamification/` returns nothing. Today a celebration fires only from a
   live socket event, which means it is missed entirely if the app is
   backgrounded, and there is no way to replay it. It also cannot be made
   idempotent across devices. This is the one gap the brief correctly
   identifies as needing a server-side fix.

2. **No streak model.** `daily_login` awards points idempotently (keyed
   `user_id:YYYYMMDD`) but nothing counts *consecutive* days, so there is no
   streak to display or celebrate.

3. **No rank movement.** `your_rank` returns the current rank with no previous
   value, so "you moved up" cannot be shown.

Everything else the new UI needs — tier thresholds, next-tier delta, point
deltas, rank — is already returned.

## 3. Libraries

Present: **Reanimated 4.5.1**, **react-native-svg 15.15.4**,
react-native-gesture-handler. Expo SDK 57.

Absent: Lottie, Skia, any haptics library.

### Dependency decisions

**Adding `expo-haptics` — justified.** Haptics are explicitly required, there
is no way to do it without a native module, and this is the Expo-managed
first-party option: no config plugin, no native build change, ~zero JS weight.

**Not adding Lottie — justified.** The brief prefers it for pre-rendered
effects, but the asset it would render does not exist: the existing modal
comments have been waiting on a design-supplied confetti file that never
arrived, and I am not going to add a dependency plus an asset pipeline for a
file I would have to invent. Confetti is a few dozen springs — Reanimated
already on the UI thread does it at 60fps with no new bytes. If design later
supplies real Lottie assets, the celebration system below is the single place
that would need to change.

**Not adding Skia.** Nothing here needs a custom shader.

## 4. Plan

Ordered by impact, committed in the units below.

**Backend** (own commits, `markt_python`)
- `UserBadge.seen_at` + `UserStats.last_tier_celebrated` → an unseen-achievement
  feed and `POST /gamification/me/achievements/seen` to acknowledge. This is
  what makes "exactly once" survive a backgrounded app or a second device.
- `UserStats.streak_days` + `last_active_date`, advanced from the existing
  `daily_login` signal.
- `previous_rank` on the leaderboard response, from the existing snapshot table.
- Migration + tests.

**Mobile** (own commits)
- `useCelebration()` + `<CelebrationOverlay />` — one queue, one renderer, one
  haptic policy. New achievement types register a descriptor rather than
  copying an animation.
- Reduced-motion honoured centrally: one `useReducedMotion()` reading
  `AccessibilityInfo`, consumed by the overlay so every celebration degrades to
  a fade in one place rather than per component. Nothing in the app reads this
  today.
- Wire the moments: badge unlock, points count-up, tier bar → tier-up, streak,
  leaderboard movement, locked-badge shimmer.

### Assumptions
- Sound is **not** implemented. It is optional in the brief, needs assets I do
  not have, and would mean a second dependency (`expo-av`). The celebration
  descriptor carries a `sound` slot so it can be added without reopening the
  system. Documented rather than silently skipped.
- Celebrations auto-dismiss at ~2s and are tap-dismissible; they never trap
  focus.

### Follow-ups (deliberately not built)
- Streak freeze / repair mechanic.
- Weekly leaderboard "podium" recap.
- Badge progress hints driven by `progress_json` (the data exists; the copy to
  explain each badge's criteria does not).
