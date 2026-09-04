# Device checklist — moderation, saved items, public profile

**Status: NOT RUN. Every item below needs a human.**

This environment is WSL2 with no `adb`, no Android emulator, and no
`xcrun`/`simctl` — iOS tooling can't exist on Linux at all. There is a local
`expo` binary but nothing to target, and seven native modules aren't installed
in this checkout (`expo-video`, `expo-notifications`, `react-native-qrcode-svg`,
`expo-task-manager`, `expo-background-task`, `expo-device`,
`expo-image-manipulator`), so a bundle wouldn't build for pre-existing reasons.

## What I *was* able to verify without a device

| Check | Result |
|---|---|
| `tsc --noEmit` | 14 errors, byte-identical to the `develop` baseline; none in touched files |
| Every external import in the new files resolves in `node_modules` | 19/19 |
| Every backend endpoint the new UI calls, exercised over real HTTP | save 201 · report accepted (+ duplicate returns same id) · block drops feed 7→4 · unblock restores · saved list renders title and price |

That covers "does it compile" and "does the API agree". It says nothing about
how any of it looks or feels.

---

## 1. Feed → "…" sheet

**Setup:** sign in as a buyer, land on the home feed.

- [ ] A "…" appears top-right of every post card and top-left of every product
      card (opposite the price badge).
- [ ] Tapping it opens the sheet at ~42% height with the item's title as the
      header.
- [ ] Tapping "…" on a **product you own** hides the Block row; the other three
      remain.
- [ ] Backdrop tap closes the sheet.
- [ ] Open the sheet on one card, dismiss, open on a different card — the second
      sheet starts on the **actions** step, not wherever the first one was left.

## 2. Save

- [ ] Tap **Save** → sheet closes, success toast "Saved / Find it later under
      Saved."
- [ ] Re-open the same card's sheet → row reads **Saved**, icon is filled and
      orange, caption reads "Tap to remove…".
- [ ] Tap it again → "Removed" toast.
- [ ] **Airplane mode → tap Save** → the row flips optimistically, then reverts,
      and an error toast appears. *(This is the rollback path; worth doing on a
      real device rather than a simulator.)*

## 3. Report (progressive disclosure)

- [ ] **Report** → step 2 shows "What's wrong?" with a back chevron and the
      caption "Pick the closest one. Reports are anonymous."
- [ ] Sheet grows to ~68% on this step.
- [ ] On a **product**, "Counterfeit item" and "Prohibited item" appear. On a
      **post**, they do not.
- [ ] Picking a reason advances to "Anything to add?" with the reason's radio
      filled.
- [ ] Choosing **Something else** shows the copy "A sentence or two helps us act
      on this."; any other reason shows "Optional — skip if there's nothing to
      add."
- [ ] Back chevron returns to the reason list with the previous choice still
      selected.
- [ ] **Send report** → spinner in the button, then the success step with a
      check mark.
- [ ] Report the same item twice → second time an "Already reported" info toast
      appears and it still lands on the success step (not an error).

## 4. Block

- [ ] From the success step, **Also block <name>** → success toast, sheet
      closes.
- [ ] That author's posts **and** products disappear from the feed immediately,
      without a pull-to-refresh.
- [ ] Pull to refresh → they are still gone (server-side filter agrees).
- [ ] Block directly from the actions step (without reporting first) → same
      behaviour.

## 5. `/saved`

Reach via **Settings → Saved**.

- [ ] Empty state: bookmark glyph, "Nothing saved yet", copy pointing at the "…"
      menu, and a **Browse feed** button that navigates to the feed.
- [ ] With saved items: rows show thumbnail, title, and price for products.
- [ ] The **All / Products / Posts** filter only appears when there's something
      to filter; selecting one refetches.
- [ ] Tapping a row opens the product or post detail.
- [ ] Tapping the orange bookmark on a row removes it immediately; if the call
      fails the row comes back and an error toast shows.
- [ ] Pull-to-refresh works; scrolling past 20 items loads more.
- [ ] Kill the network and open the screen cold → error state with a **Try
      again** button that actually retries.

## 6. Settings → Blocked accounts

- [ ] Empty state explains how to block.
- [ ] After blocking someone, they appear here with avatar and username.
- [ ] **Unblock** shows a spinner on that row, then removes it with a toast.
- [ ] Their content reappears in the feed after a refresh.

## 7. Public profile (`/profile/[id]`)

- [ ] Tapping a post author's avatar/username opens their profile.
- [ ] Header shows avatar, username, "Joined <Month Year>".
- [ ] Post / Followers / Following counts render.
- [ ] **Follow** toggles optimistically to **Following**; failure reverts it.
- [ ] Your own profile shows **no** follow button (`is_self`).
- [ ] A seller shows the shop card; tapping it opens `/shopDetails/<id>`.
- [ ] Pull-to-refresh works.

---

## Accessibility — needs a screen reader, cannot be inferred

Run with **VoiceOver** (iOS) and **TalkBack** (Android).

- [ ] The "…" reads "More options for this post" / "More options for
      <product name>", role **button**.
- [ ] Sheet rows read label + caption; Save reads "Save for later" or "Remove
      from saved" depending on state.
- [ ] Reason rows read "<label>. <hint>" and announce **selected** state.
- [ ] The detail field reads "Add details about your report, optional".
- [ ] **Send report** announces its busy state while submitting.
- [ ] Block rows name the person ("Block ada", "Unblock ada") — not "this item".
- [ ] Saved-list rows read "Open <title>"; the bookmark reads "Remove <title>
      from saved".
- [ ] Filter chips expose role **tab** and selected state.
- [ ] Focus order is top-to-bottom in each sheet step, and moving between steps
      moves focus to the new header rather than stranding it.

## Hit targets — measure, don't eyeball

- [ ] Every sheet row ≥ 44pt (they're built at 56pt where a caption is present).
- [ ] The "…" button is 44×44 with `hitSlop` 10.
- [ ] Bookmark and Unblock buttons ≥ 44pt.
- [ ] Filter chips ≥ 36pt tall with adequate horizontal padding.

## Dynamic type

- [ ] iOS: Settings → Accessibility → Larger Text at max. Android: Font size
      largest.
- [ ] Sheet rows grow without clipping the caption.
- [ ] Empty-state copy wraps rather than truncating.
- [ ] Saved-list titles wrap to 2 lines and the price stays visible.
- [ ] Nothing in the profile header overlaps.

## Reduced motion

- [ ] iOS: Accessibility → Motion → Reduce Motion on. Android: Remove
      animations.
- [ ] The sheet still opens and closes usably. *No custom animation was added —
      the transitions come from `@gorhom/bottom-sheet` — so this is verifying
      the library behaves, not our code.*

## Both platforms

- [ ] iOS: sheet respects the home-indicator safe area.
- [ ] Android: hardware back closes the sheet rather than the screen.
- [ ] Keyboard over the detail field doesn't cover **Send report** (the sheet is
      at 68% on that step).
- [ ] Dark mode on both: check contrast on the muted caption text and the
      orange-on-dark accent.

---

## Known gap to confirm while you're in there

- [ ] Cold-start a card you previously saved → the sheet shows **Save**, not
      **Saved**. Expected: feed items don't carry `saved_by_me` yet, so saved
      state only survives within a session. Backend `saved_ids()` exists for
      this; wiring it into feed hydration is the follow-up.
