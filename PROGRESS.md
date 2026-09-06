# CrewApply Web — Progress

Next.js web build of the CrewApply mobile app. English only. App theme, not admin theme.
Backend is **read-only** — no backend code beyond one env var.

Tick boxes as they complete. Update **Status** when a phase closes.

**Status:** Phases 0–3 ✅ (infrastructure) · **Phase 4 = screens, next.** SEO moved to Phase 5 —
scaffolding is not something a client can look at.
**Target:** 4–5 weeks solo

---

## Ground rules

1. English only. No i18n library, no locale files, no `/[lang]/` routes.
2. The app's theme is law. Admin contributes **behavior only** — strip every class.
3. Zero backend code. One env var in config. Nothing else is touched.
4. One `'use client'` boundary at `(app)/layout.jsx`. Never SSR the authenticated app.

---

## Phase 0 · Config — ✅ COMPLETE

**Zero changes were needed.** Verified against a live backend on `localhost:5000`.

- [x] Web origin in `ALLOWED_ORIGINS` — **already present.** `.env:35` is
      `http://localhost:3000,http://localhost:5173`, and `:3000` is Next's dev default.
      Preflight from `http://localhost:3000` returns `204` + correct ACAO/ACAM/ACAH.
      A non-allowed origin gets no ACAO header (rejected as a 500 — ugly, but correct).
- [x] `/uploads/*` cross-origin — confirmed `Cross-Origin-Resource-Policy: cross-origin`
      **and** `Access-Control-Allow-Origin: http://localhost:3000` on upload responses.
      Job/company logos and avatars will embed in the web app with no change.
- [x] Rate limiter — headers confirmed: `RateLimit-Policy: 600;w=900`.
      Authenticated requests bucket **per user** (`u:<jwt sub>`, unverified claim, bucket
      selection only), anonymous ones **per IP** (`ip:<addr>`). See the ⚠️ under Phase 5.

Already correct, do not change: helmet `crossOriginResourcePolicy: 'cross-origin'`,
bearer-token auth (no cookie/CSRF work), Razorpay order → verify → HMAC webhook.

### Verified public API surface — the Phase 5 SSR contract

Base `http://localhost:5000/api/v1`. All return **200 with no auth header**:

| Endpoint | Feeds |
|---|---|
| `GET /jobs` | `/jobs` list — paginated, `meta.pagination` |
| `GET /jobs/:id` | `/jobs/[id]/[slug]` detail |
| `GET /job-taxonomies?type=category` | category landing pages |
| `GET /job-taxonomies?type=department` | department landing pages |
| `GET /job-taxonomies?type=vesselType` | vessel-type landing pages |
| `GET /banners` | landing page |
| `GET /geo/cities` | location fields (**`/cities` only** — there is no `/geo/countries`) |

`?type=` is **required** on `/job-taxonomies` — omitting it returns 400, not everything.

### 🔴 Discovered: the backend already expects a web client to exist

`email.service.js:37` sends `${config.client.url}/verify-email/${token}` — and
`CLIENT_URL` is `http://localhost:3000`, which today serves nothing. **Every email
verification link the backend has ever sent is dead.** The web app fixes this by
implementing that route. Added to Phase 4 Block A.

(Password reset deliberately uses an OTP instead, with the comment *"there's no web app
to hand a reset link off to."* Once the web app ships that could become a link — but
that is a backend change, so not now.)

### JSON-LD field audit (from a live `/jobs` payload)

Present and usable: `title`, `description`, `publishedAt`→`datePosted`,
`company.name`→`hiringOrganization`, `salary{min,max,currency,period}`→`baseSalary`,
`employmentType`, `location.country`.

Gaps that weaken SEO — **data entry, not code**:
- `location.city` is often `null` — country-only postings rank far worse
- `applicationDeadline` is often `null` — without `validThrough`, Google expires the posting after 30 days
- `company.logoUrl` is often `null`
- Jobs have **no `slug` field** — derive the slug from `title` in the web app, match on `_id`
- `employmentType` is `"Full Time"`; Google's enum wants `FULL_TIME` — needs a ~5-line map in Phase 5

---

## Phase 1 · Scaffold + theme system — ✅ BUILT

- [x] Scaffold `crewapply-web` — **Next 16.3.4** (create-next-app now ships 16; App
      Router is unchanged, Turbopack build), React 19.2.8, Tailwind v4, JS not TS
      so the ported data layer copies verbatim
- [x] Route groups: `(public)/` server components, `(app)/layout.js` holds the single `'use client'`
- [x] Manrope via `next/font/google`, weights 400/500/600/700/800, self-hosted
- [x] `theme/colors.js` → `@theme` vars. **All 30 hex values verified present in the built CSS**
- [x] `theme/spacing.js` → raw px → rem (9 spacing + 2 layout + 8 radius)
- [x] `theme/shadows.js` → 5 `box-shadow` values, copied from the Figma CSS in its own comments
- [x] Gradients → 5 × `linear-gradient(180deg, …)` + `@utility bg-gradient-*`
- [x] `background.glass` + blur → `@utility glass`, `blur(15px)` (the app's own
      `blurAmount={15}`), with an `@supports` fallback to the Android `rgba(…,.94)`
- [x] `theme/motion.js` → durations, 3 easings, rise/slide distances, `@utility press` / `press-card`
- [x] Type scale — **fluid `clamp()` instead of breakpoint tiers.** min = the app's exact
      px at its 375 baseline, max = desktop at 1440. One definition per size, no jumps.
      Line heights are the app's own size/height ratios, unitless, so they track the clamp.
- [x] `utils/responsive.js` **not** ported
- [x] `/theme` page — 35 colour swatches, 10 type specimens, 5 weights, spacing,
      radius, shadows, gradients, glass-over-gradient, motion, and one composed job card
- [x] Accessibility floor: brand `:focus-visible` ring, `prefers-reduced-motion` block,
      `color-scheme: light` (the app has no dark mode, so neither does the web)
- [x] `npm run build` green — `/` and `/theme` prerender static, route groups do not appear in URLs

- [ ] 🚧 **GATE — yours, not mine.** Open `/theme` at a **375px viewport** beside the
      running app and confirm fidelity. Nothing in Phase 3 should start until this passes.

Dead as promised, replaced by plain CSS: `react-native-linear-gradient` (27 files),
`@react-native-community/blur` (1), `react-native-reanimated` (24).

### Gotchas worth remembering

**1. `@theme` tree-shakes unused tokens.** `--color-secondary`, `--color-success` and
`--color-accent` were silently absent from the built CSS, so every `var(--color-…)` in
an inline style resolved to nothing. Fixed with **`@theme static`**, which emits all of
them. Costs ~1.3 KB. Do not remove `static`.

**2. 🔴 `--spacing-*` shadows `--container-*`. Never tokenise spacing.**

Tailwind resolves `max-w-*`, `min-w-*` and `basis-*` against the `--spacing-*` namespace
**before** `--container-*`. So defining `--spacing-sm: 0.5rem` turned:

```
.max-w-sm{max-width:var(--spacing-sm)}   →  8px, not 24rem
.max-w-md{max-width:var(--spacing-md)}   → 12px, not 28rem
```

Every card on the site collapsed to the width of its longest word. `max-w-3xl`/`6xl`
were unaffected only because no `--spacing-3xl` existed — which is why it looked like a
random subset of pages was broken.

**Fix: the spacing namespace is deleted, not renamed.** Tailwind's numeric scale (base
0.25rem = 4px) already *is* the app's scale, so `spacing.js` maps straight onto it:

| app | px | class | | app | px | class |
|---|---|---|---|---|---|---|
| `xxs` | 2 | `0.5` | | `xl` | 20 | `5` |
| `xs` | 5 | `[5px]` | | `xxl` | 24 | `6` |
| `sm` | 8 | `2` | | `xxxl` | 32 | `8` |
| `base` | 10 | `2.5` | | `layout.gutter` | 12 | `3` |
| `md` | 12 | `3` | | `layout.screenHMargin` | 15 | `[15px]` |
| `lg` | 16 | `4` | | | | |

Only 5px and 15px are off the 4px grid; they stay arbitrary rather than being rounded,
because the app's values are copied, not adjusted. The mapping table is repeated in
`globals.css` and rendered on `/theme`.

Radius, shadow and text **do** override Tailwind's same-named defaults — that is
intended and safe, because nothing resolves across those namespaces. Spacing was the
only one that crossed.

`--container-prose` was also dead: Tailwind's built-in `max-w-prose` (65ch) wins, and
65ch already satisfies the under-80ch rule. Removed.

### Deviations from the app, both deliberate

1. **Type gets bigger on desktop.** The app bottoms out at 10px and 11px, which is fine
   on a 3× phone panel and unreadable on a monitor. Mobile is byte-identical; the clamp
   only grows above 375px.
2. **Token names read as Tailwind utilities.** `text.primary` → `--color-heading` →
   `text-heading`; `border.light` → `--color-line-soft` → `border-line-soft`. Colours are
   untouched — only the names changed, and every renamed line carries its app-side path
   in a comment.

---

## Phase 2 · Vertical slice — ✅ BUILT (runtime click-through pending)

**7,194 LOC copied verbatim. Not one copied file was edited.**

The plan said "import paths unchanged"; that is now literal. `next.config.mjs`
maps every native module to a shim in `src/platform/`, so the copied code still
says `from 'react-native'` and the bundler answers. Re-copying a service from the
app later is a file copy, not a porting exercise.

**Proof it works: zero React Native packages are installed.** `package.json`
dependencies are `axios · country-state-city · next · react · react-dom`. Nothing
else. Yet all 7,194 lines compile and server-render — which is only possible
through the aliases.

- [x] `AsyncStorage` → `localStorage`, promise-based (callers `await` it), with an
      in-memory fallback for Safari private mode / blocked storage / SSR
- [x] `navigationRef` → Next router, injected once by the `(app)` layout.
      `reset()` uses `replace()` so a dead session is not reachable with Back
- [x] `useFocusEffect` → plain mount effect. **Deliberately not** also on
      `visibilitychange`: `dataSync` already sweeps every cache on foreground
      centrally, so wiring it here too would fire 7 duplicate refetches per tab switch
- [x] `react-native` shim — only `Platform`, `AppState`, `PermissionsAndroid` are
      needed. `Animated`/`Dimensions`/`DevSettings`/`I18nManager` were used solely by
      `SidebarContext` and `LanguageContext`, **both dropped** (sidebar is rebuilt
      natively; there is one language)
- [x] `react-native-localize` gone with `LanguageContext`
- [x] geolocation → `navigator.geolocation`
- [x] `react-native-razorpay` → **real** web checkout (`checkout.js`), same promise
      shape as the native SDK, so `usePlanSummary.js` copies over untouched
- [x] Firebase messaging + notifee → no-op stubs. push.service is on the **login
      path**, so they must resolve rather than throw
- [x] i18n → a **30-line English string table**, not a library. See below.
- [x] Copy `api/ services/ hooks/ context/ store/ constants/ utils/` — 7,194 LOC
- [x] `/login` on `useAuth` + `/dashboard` on `useJobsData`, both in the app theme
- [x] `npm run build` green; both pages prerender, proving the shims are SSR-safe

- [x] Backend path verified with a real account — login `200`, and every endpoint the
      dashboard's contexts call returns `200` with the bearer token:
      `/saved-jobs`, `/applications`, `/user/profile`, `/jobs`
- [ ] 🚧 **Browser click-through — needs you.** `/login` → `/dashboard`.

**Test account:** `irfancloudx3@gmail.com` (role `user`). Note `irfanx3@gmail.com`
does not exist in the database — the working address has `cloud` in it.

⚠️ The backend's `MONGODB_URI` points at the **shared Atlas cluster**, not a local
database. Local dev reads and writes the same 31 users and the same job postings as
everything else pointed at that cluster. Worth knowing before any destructive testing.

Do not move to cookie auth. Do not SSR logged-in pages.

### i18n: a string table, not internationalisation

The plan said inline 66 `t()` calls across 16 files. I didn't — that would mean
re-editing them on every future re-copy, and would scatter user-facing copy through
the service layer. Instead `src/i18n/index.js` is ~30 lines that look up the English
`translation.json`: dotted-path lookup, `{{var}}` interpolation, i18next plural
suffixes, and `exists()`. **One language, no library, no switcher, no `/[lang]/`
routes** — and zero edits to the 16 files.

### Deliberately NOT implemented

- **`blob-util` is a stub that throws.** The 3 PDF services use it as a real
  filesystem (dirs/exists/mkdir/cp/unlink/stat + Android download manager + iOS
  preview). The browser needs none of that. Phase 5 replaces all three with an
  `<iframe>` and an object URL. Methods throw a named error rather than silently
  resolving, so nothing can quietly return an empty file. Nothing on the
  login/jobs path touches it.
- **Web push is stubbed, not built.** The web registers no device token, which is
  correct — it has none. Phase 6.

### Gotcha

`../i18n/getErrorMessage` is imported by 7 hooks and was missed by my first import
scan — the regex `[a-zA-Z]*` doesn't match the digits in `i18n`. Copied verbatim; it
needed `i18n.exists()` added to the string table.

---

## Phase 3 · Component kit — 🟡 CORE BUILT, review at `/kit`

**17 components in `src/components/ui/`, all measured against the app's own
sources** (`AppButton`, `AppInput`, `AppCard`, `StatusBadge`, `AppText`, `JobCard`)
rather than eyeballed. Gallery: **`/kit`**.

### 🔴 Fidelity errors this caught in my own Phase 1–2 work

Reading the app's components instead of inventing them found three things wrong
in what I had already shipped:

1. **Buttons are `rounded-md` (10px), NOT pills.** `AppButton` uses
   `spacing.borderRadius.md`. Pills are for badges and chips only. My login and
   theme pages had pill buttons throughout.
2. **Cards carry a 1px `border.light` stroke** and default to `shadow-sm`, not
   `shadow-md`, at `rounded-md` not `rounded-lg`. That soft blue stroke is what
   keeps a white card legible on the ocean-blue canvas; dropping it is the
   fastest way to look wrong at a glance.
3. **Inputs are 12px radius and 50px min-height.** The app comments that *no*
   radius token equals 12 (md is 10, lg is 16) and that swapping to either
   visibly changes the corner — so it stays an arbitrary value here too.

Login and Dashboard were rebuilt on the kit, which fixed all three.

### Built (17)

| Component | Source of truth |
|---|---|
| `Icon` + `icon-paths.js` | **60 FontAwesome glyphs**, see below |
| `Button` | `AppButton` — 48px min, 10px radius, px-20, gradient/outline/text, press 0.96 |
| `Input` | `AppInput` — 50px min, 12px radius, error/focus/hint, icons |
| `Select` | native `<select>`, styled to match `Input` |
| `Card` | `AppCard` — border, radius 10, p-16, press 0.985 |
| `StatusBadge`, `Chip` | `StatusBadge` — full status vocabulary ported |
| `EmptyState`, `LoadingState`, `Skeleton`, `InlineAlert`, `ErrorState` | new, on app tokens |
| `Avatar`, `ProgressBar`, `SectionTitle` | new; track colour is `primary.tint`, which the palette annotates as "progress track" |
| `Modal`, `ConfirmationModal` | admin behaviour, on native `<dialog>` |
| `Tabs`, `Pagination` | admin behaviour, restyled; windowed page numbers |
| `JobCard` | app `JobCard` — three columns: logo / content / actions |

### Icons: extracted, not depended on

The app uses **FontAwesome** in 73 of its 80 icon files (not MDI — only 6 use
that). Admin's stroke-based 24×24 set would have looked visibly wrong, so
`scripts/extract-icons.mjs` pulls the **exact 60 glyphs the app uses** out of the
FontAwesome packages into a 23 KB data file. Keys are the app's own names, so a
ported component keeps `name="map-marker-alt"`.

FontAwesome stays a **devDependency** — used only by that script, never at
runtime. Re-run `node scripts/extract-icons.mjs` after adding a name to it.
Icons are CC BY 4.0, attributed in the generated file header.

### 🔴 Review round 1 — three more bugs, two of them systemic

**1. `className` could not override a component's own classes.** `JobCard` passed
`className="min-h-9"` to `Button`, whose base had `min-h-12`. Same specificity, so
Tailwind's *output order* decided — not the string order — and the Apply button
rendered full height, roughly doubling the card. **Fix: `size` is a real prop
(`sm`/`md`) with its own class set.** `size` had been declared in the signature
and never used. Rule going forward: anything that varies by size or state belongs
in the component's own variant map, never appended by a caller.

**2. `:focus-visible` was unlayered, so it outranked every utility.** Unlayered
CSS beats all `@layer`s, including Tailwind's utilities — so `outline-none` on an
`<input>` could never win, and `Input` drew a second focus ring inside its
bordered wrapper (the "box in a box"). **Fix: the rule moved into `@layer base`.**
It is still the default everywhere, but overridable, which is the point of layers.
This affected every element with its own focus treatment, not just inputs.

**3. `JobCard` — copied the app's pixels where it should have translated its
proportions.** Two passes to get right, and the second is the lesson.

*First pass:* never measured at all. The app's real StyleSheet has a 96×96 logo
(I had 48), 15/18 title, 13px salary, tier badge at radius 10 **not pill**, 2px
bookmark padding, apply pill radius 20 / px16 / py8 / 12px bold **solid blue, no
gradient**. I also rendered a **company-name row the app's centre column does not
have** — a row that existed nowhere in the source, costing ~18px on its own.

*Second pass:* even measured exactly, it was still twice too tall — because the
app's card is **290px wide** with its text stacked in four rows, since that is all
a phone column fits. Dropped into a 672px web card those numbers invert: an
oversized logo, four short text rows, and dead space to the right.

**This is the plan's own "map patterns, never scale pixels" rule, and I broke it
by being too literal.**

*Third pass — the shape itself was wrong.* Both earlier attempts kept it as a
**wide row**, which is right for the app (one narrow column) and wrong for the
web. It is now a **media tile**: a 16:9 image band on top, then badges, title +
save, company, and a pinned footer with location/type, salary and a full-width
CTA. `radius="lg"` (16px), `padding="none"` so the image bleeds to the edges, and
a row holds two or three.

Design decisions in that tile worth not undoing:
- **Aspect ratio, not a pixel height.** 16:9 keeps the image at ~47% of the tile
  at *every* column width; a fixed height would drift as the grid reflows.
- **Logo is `object-contain` on a `primary-light` panel, not `object-cover`.**
  Company marks are square or wide on transparent backgrounds — cropping them to
  fill turns them into abstract fragments. The tint means a logo-less listing
  still looks deliberate rather than broken.
- **Save sits on the title row, not floating over the image.** It is an action on
  the job, so it belongs with the job's name, and it never has to fight a busy
  logo for contrast. Same position whether or not badges are present.

> ⚠️ **No job in the database has `company.logoUrl` set**, so today every
> production tile renders the fallback panel. Three logos exist in
> `uploads/company/` but nothing references them. Same class of gap as the
> JSON-LD audit in Phase 0 — data entry, not code. `/kit` shows one tile wired to
> a real uploaded logo so both states are reviewable (and it confirms
> `next/image` `remotePatterns` works against the live API).

Two details make a grid of them line up:
- `h-full` — the tile fills whatever height the grid row settles on
- `mt-auto` on the footer — salary and button sit on the same baseline whether
  the title runs one line or three

Parent supplies the grid: `grid gap-3 sm:grid-cols-2 xl:grid-cols-3`. Dashboard
and `/kit` both updated.

**`Card` gained `radius` and `padding` props** for the same reason `Button`
gained `size`: `className="rounded-lg"` cannot reliably beat a base
`rounded-md`. Third time this class of bug appeared — **anything that varies goes
in the component's variant map, never in a caller's className.**

**Scrollbars** are styled with `scrollbar-width`/`scrollbar-color` plus the
`::-webkit-` rules, as a `scrollbar-thin` utility — no library. Applied to the
`Select` list; reuse it on the filter rail and job list in Phase 5.

> The app writes the JobCard salary colour as `#056DED` — one digit off the
> palette's `#056DEC`. Treated as a typo and rendered from the token. Flagged
> rather than copied, since propagating it would make the token a lie.

### Deviation from the plan — reversed on review

`Select` was first built on a native `<select>`: fewer lines, and the browser
supplies keyboard nav, type-ahead, mobile pickers and autofill for free. But a
native option list is painted by the OS — it cannot be rounded, cannot take the
app's colours, and renders with a grey gradient on Windows whatever the CSS says.
A styled dropdown was required, so **it is now a real listbox**: arrow/Home/End
navigation, Enter/Space commit, Escape cancel, type-ahead, click-outside,
scroll-into-view, full combobox/listbox ARIA, and a hidden input so it still
posts in a form. Closed it is pixel-identical to `Input`; open it is a 10px-radius
panel on `shadow-lg`.

`ponytail:` still no search field in it. The app uses `SearchablePickerSheet` for
genuinely long lists (rank, nationality — hundreds of options); add a searchable
variant when a Phase 5 screen needs one.

### Still to build (deferred until a screen needs them — YAGNI)

`ReusableForm` · `ReusableTable` · `DatePicker` (start from `<input type="date">`)
· `ImageDropzone` · `SearchBar` + suggestions · `ActionMenu` · `CreatableSelect`
· `GlassCard` · two-pane master-detail shell · sidebar + bottom bar ·
`TemplateThumbnailPreview` · PDF `<iframe>` viewer

- [ ] 🚧 **Review `/kit`** against the app before Phase 5 starts.

### Original plan checklist

- [x] `Icon` + `icon-paths.js` — kills `react-native-vector-icons` across 75 files
- [ ] `form/Select`, `form/CreatableSelect`
- [ ] `form/ReusableForm`
- [ ] `form/ReusableTable`
- [ ] `form/DatePicker`
- [ ] `form/ImageDropzone` — kills `image-picker` + `image-crop-picker`
- [ ] `Modal`, `ConfirmationModal`
- [ ] `SearchBar` + `SearchResultsDropdown`
- [ ] `Pagination`, `ActionMenu`, `Tabs`, `ErrorBoundary`

### Build fresh from app tokens (12)

- [ ] `Button` (primary/secondary, `primary.gradient`)
- [ ] `Input` (`border.input` = `#E2E8F0`)
- [ ] `Card` (`paper` + `shadows.md` + `radius.lg`)
- [ ] `GlassCard` (`background.glass` + backdrop-filter)
- [ ] `StatusBadge` (from `colors.status.*`)
- [ ] `Chip` (pill radius, `primary.tint`)
- [ ] `EmptyState`, `LoadingState`, `SectionTitle`, `Avatar`, `InlineAlert`, `ProgressBar`

### App-specific, new (6)

- [ ] `JobCard` — used on ~5 pages
- [ ] Two-pane master-detail shell (Jobs)
- [ ] Sidebar (desktop) + glass bottom bar (mobile, `shadows.float`)
- [ ] `TemplateThumbnailPreview` — resume templates, hardest custom piece
- [ ] PDF viewer → `<iframe>` (~20 lines, replaces 3 services)
- [ ] Razorpay checkout — `<script>` + ~30 lines

Reuse `country-state-city` (already a dep in app + backend). Add nothing for location fields.

> Use the app's `border.light` = `rgba(183,218,255,0.35)`. Admin's equivalent renders
> white and is invisible on white surfaces — do not inherit that bug.

---

## Phase 4 · Screens, one at a time — 2–3 weeks

**Moved ahead of the SEO surface deliberately.** Everything built so far — theme,
kit, login, a job list — is scaffolding. A client cannot see scaffolding. Screens
are the demo, so they come first and SEO waits.

**40 app screens → ~30 web routes.** The hooks already hold every state machine
(they were copied verbatim in Phase 2), so a screen is JSX around working logic,
not a rewrite. LOC below is the app screen's size, as a difficulty signal.

### 📸 Reference screenshots — ask before building each block

The app's screens are thin; the design lives in the ~104 feature components they
compose (`HomeScreen` is only 194 LOC but pulls in 10 components). Reading JSX
gives structure but not proportion, and three rounds of card revisions showed
exactly how expensive guessing at proportion is.

Screenshots wanted, in the order they are needed:

| Priority | Screen | Why it can't be inferred |
|---|---|---|
| 1 | **Home / Dashboard** | 194 LOC of screen, 10 components — the layout is entirely in the parts |
| 2 | **Job Details** | 1,493 LOC, the biggest screen in the app |
| 3 | **Career Profile (CV) + Resume editor** | completion ring, section cards, template thumbnails |
| 4 | **Profile** | 104 LOC of screen, 8 components |
| 5 | **Consultancy** | 1,066 LOC, second biggest |
| 6 | **Subscription + Plan summary** | pricing layout, billing toggle |

---

### Block A · Account & onboarding — ✅ BUILT

🔒 **Route protection added — every route was open before this.**

`AuthGuard` wraps everything under `(app)`. Three states, and the middle one is
the point: while the token read is unresolved it renders **nothing of the page**,
which is what stops a protected screen painting its contents for a frame before
the redirect. Anonymous users get `replace()` (not `push`, so Back cannot land on
a page they cannot see) to `/login?next=<path>`, and sign-in returns them there.

`?next=` is validated before use — anything not starting with a single `/` is
discarded. `//evil.com` is protocol-relative and browsers treat it as absolute,
so the second character is checked too. An open redirect on a login page is a
real vulnerability, not a nicety.

**This is the second layer, not the only one.** `api/client.js` already tears the
session down on a 401, and the backend is the actual gate. A client guard only
decides what gets painted — it cannot enforce anything, and it is not meant to.

⚠️ **Why it must be client-side:** the session is a bearer token in
localStorage, which the server cannot read, so Next middleware sees nothing.
Server-side protection needs httpOnly cookies — backend changes plus a rewrite of
the refresh interceptor. Deliberately out of scope; see Phase 2.

The public-path list lives in **one place** (`AuthGuard`) and the layout imports
it for the chromeless decision too. Two lists would drift, and drift here means
either a sidebar shown to a stranger or a lockout from the sign-in page.

Verified with no session: `/dashboard` server HTML contains none of "Welcome
Back", "Featured Jobs", "Categories" or the search bar — only the placeholder.
`/login` renders in full.

| Route | Built | Notes |
|---|---|---|
| `/login` | [x] | `?next=` return path, forgot-password link, signup link |
| `/signup` | [x] | **3 app screens → 1 page.** 1,490 LOC of TellUsAboutYourself + Location + StayConnected. Payload verified field-by-field against `auth.validation.js` |
| `/signup/verify` | [x] | OTP. **One input, not six boxes** — six needs focus juggling, paste splitting and backspace handling, and breaks `autocomplete="one-time-code"` autofill. 60s resend cooldown, because the backend's OTP limiter is shared with registration and a hammerable button locks people out of their own signup |
| `/signup/done` | [x] | Points at CV + rank — the two things the per-job eligibility check actually tests |
| `/forgot-password` | [x] | OTP, not a link. Same message whether or not the address exists — the endpoint is silent by design so it cannot be used to enumerate accounts |
| `/reset-password` | [x] | `confirmPassword` checked locally *and* server-side |
| `/verify-email/[token]` | [x] | 🔴 **The dead link from Phase 0 is now live.** Called with `apiClient` directly rather than adding a method to the mirrored `auth.service.js` — the mobile app has no such call, and adding one would break "re-copy is a plain file copy" |

**Native platform features used instead of components:** `<input type="date">` for
date of birth (real picker, keyboard entry, locale formatting, free),
`autocomplete="one-time-code"` for OTP autofill, `country-state-city` via the
already-copied `geo.utils` for country/state. No `DatePicker` or searchable
`Select` was needed after all — the block's predicted kit additions did not
materialise.

**Field-name trap avoided:** the API wants country **names**, but the dataset is
keyed by ISO code. State holds the code (states are looked up by it) and maps to
the name only at submit.

#### Original route table

| Route | From | LOC | Notes |
|---|---|---|---|

| Route | From | LOC | Notes |
|---|---|---|---|
| `/login` | LoginScreen | 399 | ✅ built in Phase 2, needs forgot-password link + polish |
| `/signup` | TellUsAboutYourself + Location + StayConnected | **1,490** | **Three phone steps → one sectioned web form.** The split exists because a phone shows one field group at a time |
| `/signup/verify` | OTPVerification | 381 | |
| `/signup/maritime` | MaritimeProfile | 507 | `useJobTaxonomyOptions` — rank, department, vessel |
| `/signup/done` | Success | 174 | |
| `/forgot-password` · `/reset-password` | both | 560 | OTP-based, not a link |
| `/verify-email/[token]` | — | — | 🔴 **NEW.** The backend has always emailed this link and nothing has ever served it. See Phase 0 |

`WelcomeScreen` (78) folds into the public landing page in Phase 5.

### Block B · Dashboard — ✅ BUILT (screenshot received)

- [x] **`AppShell`** — the plan's headline responsive translation, and every later
      screen inherits it: persistent left sidebar from `lg`, the app's floating
      **glass bottom bar** (16px inset, pill radius, `shadow-float`) below it. The
      app's hamburger drawer disappears on desktop — there is room to show its
      contents permanently, so the sidebar lists both tiers.
      `CHROMELESS` routes (`/login`, `/signup`, …) render bare: you cannot show a
      sidebar of destinations to someone who has not signed in.
- [x] `/dashboard` — hero + navy search panel, category tiles (the app's own SVGs,
      copied verbatim), featured jobs grid, subscription alert/status, CV status,
      recently applied, tracker + consultancy cards
- [x] `ProfileProvider` mounted — the shell's avatar needs it

**Responsive translation:** the app stacks all ten sections in one column. Here the
secondary cards (subscription, CV, promos) move to a **right rail from `xl`**, so
jobs and applications — what the user came for — stay above the fold instead of
being pushed down by chrome.

🔴 **Two shapes I guessed wrong and the build could not catch** — both would have
rendered blank cards against the live API:
- `cvStatus` is `{ completionPercent, lastUpdated }`, not `{ hasCv, updatedLabel }`
- applications are `{ id, jobId, title, location, logo, status, dateText, appliedAt }`
  — `title` not `jobTitle`, `dateText` not `appliedLabel`, and no `statusLabel`

Lesson for the remaining blocks: **read the hook's return shape and the service's
mapper before writing the JSX**, not after. A green build proves nothing about
field names.

Relative dates use `Intl.RelativeTimeFormat` — no date library. Applications
already arrive pre-formatted as `dateText`, so only the CV timestamp needs it.

### Block C · Jobs — 🟡 2 of 5 built (screenshot received)

- [x] `/jobs` — `useJobsData`. **FilterJobsModal (529 LOC of bottom sheet) is now a
      persistent rail** from `lg`, which turns the hook's debounced preview count
      into a live result count — better than the "View 47" button it was written
      for. Below `lg` it collapses to a `<details>` disclosure rather than a modal:
      same content, no focus-trap machinery to maintain.
- [x] `/jobs/[slug]` — **rebuilt as a full mirror of the app's JobDetailsScreen.**
      Readable URLs: `/jobs/second-engineer-bulk-carrier-<id>` — slug AND id, the
      shape LinkedIn and Stack Overflow use. A pure `/jobs/deck-officer` would
      need a unique slug column and a lookup endpoint, i.e. backend work.
      **Backward compatible by construction**: the id is parsed as the trailing
      24 hex chars, so the app's existing `crewapply.com/jobs/<id>` share links
      (ReferJobModal) still resolve with no redirect table. Slug leads because
      WhatsApp truncates URLs from the END, and WhatsApp sharing is a first-class
      feature here.

      Mirrored exactly, and each of these would have been got wrong by design:
      - **The green/red banner is about DOCUMENTS ONLY** (`isEligible =
        hasRequiredDocuments`), not overall eligibility. "You're eligible" above a
        Subscribe card is deliberate — documents own the banner, subscription owns
        the unlock card.
      - **Blocker precedence is load-bearing:** tier → noSubscription → tier →
        limit. Tier is checked *before* "no subscription" when the job needs more
        than base tier, or a new user on a Premium job buys the cheapest plan and
        is still blocked. That reasoning is the app's own comment.
      - **`eligible` is never recomputed client-side.** Hiding Apply is UX; the
        backend re-checks at apply time.
      - **Applied is a MODE**: eligibility is not even fetched, documents relabel
        to "Submitted", missing flags suppressed, refer hidden on rejection, docs
        status line hidden on rejection, action bar collapses to one button.
      - Usage pill with three severities (critical / warning ≤30% / normal),
        hidden for unlimited plans and when there is no subscription.

      **Solved differently on web:** the app gets `application` from route params;
      a URL has none and there is no `GET /applications?jobId=`. So
      `AppliedJobsContext.isApplied(jobId)` gates a list fetch — the common case
      costs nothing and no endpoint was invented.

      🔴 **Copy keys I guessed wrong:** `rejectedBannerTitle`/`Subtitle` do not
      exist (rejection uses `notSelectedTitle`/`Subtitle`), and `allDocsPresent`
      is actually `haveAllDocs`. Both would have rendered the raw key on screen.
      All 23 `t()` keys are now verified against `translation.json`.
- [x] `/saved` — client-side filter + pagination via `useSavedJobs`
- [x] `/search` — universal search. Results are **lightweight rows**
      (`{id, title, subtitle, navigable}`), not job objects, so they render as
      rows rather than JobCards — a card needs salary/location/tier the search
      payload does not carry. Deliberately does **not** call `resolveJob()` per
      row on mount: that is one request per result to draw a card nobody clicked.
      Empty results fall back to the hook's `suggestedJobs`, which *are* full jobs.
- [x] `/alerts` — gated on subscription, with the upsell card
- [x] `SubscriptionProvider` mounted (alerts needs it)

**Block C complete.** All routes verified 200 against the live backend.

🔴 **Contract mismatches caught by reading, not by the build:**
- `useSearchParams()` **must** sit under a `<Suspense>` boundary or the production
  build fails at prerender. Dev does not complain.
- `SavedJobsContext.toggleSaved(job)` takes the **job object**, not an id.
- `AppliedJobsContext` has **no `markApplied`** — its value is
  `{ appliedJobIds, isApplied, refresh, refreshIfStale, isFetching }`. After a
  successful apply, call `refresh()` so every screen reading it agrees.
- `useSubscriptionStatus()` exposes **`isActive`**, not `hasActiveSubscription` —
  and a **`loading`** flag that stays true until the first fetch *starts*. Gating
  the upsell on `loading` is what stops a subscriber seeing one frame of "you have
  no plan". Comparing `hasActiveSubscription === false` would have been
  `undefined === false`, so the upsell would simply never have appeared.
- `useSavedJobs` exposes **`setCurrentPage`**, not `handlePageChange` like
  `useJobsData` does. Two hooks, two names for the same idea.

Every context contract is now quoted in a comment at its call site.

**Running tally: 8 shape mismatches across 3 blocks, 0 caught by the compiler.**
JS + verbatim-copied hooks means the build can only prove that names resolve, not
that they mean anything. Reading the hook's `return` and the service's mapper
before writing JSX is not optional on this project.

### Block D · Applications — ✅ BUILT (screenshot received)

- [x] `/applications` — heading + "Your CV" action, status tabs with counts,
      card grid, pagination, Need Help, admin banner, Personal Consultancy.
      Composition and order are the app's.
- [x] **`PromoBanner`** — the admin-managed banner, now live. `GET /banners`
      returns `{ id, imageUrl, linkUrl }`; images are served from
      **api.crewapply.com** (already in `remotePatterns`), verified end-to-end
      through the optimizer at 59 KB → 51 KB.

**Mirrored, and each would have been wrong by default:**
- **Withdraw is not offered on every card.** The withdrawable set is derived
  from the *Active tab's own statuses* (applied · under_review · interview), so
  a selected or rejected application shows no withdraw action. Deriving it from
  the tab rather than repeating a list is the app's own single-source-of-truth
  comment, copied for the same reason.
- **A banner fetch failure is SILENT.** The app comments "Silent — the default
  slide below covers this". A promo strip is not worth an error message on a
  screen someone opened to check their applications.
- **A banner with no `linkUrl` is not clickable.** The admin decides that per
  banner, so it must not pretend to be a button.
- `useApplicationsData` exposes **`setCurrentPage` / `setActiveTab`**, not
  `handlePageChange` — the same naming split already noted for `useSavedJobs`.

**Deliberately simpler than the app:** the app measures every remote image to
get its true aspect ratio, because React Native cannot size a remote image
otherwise. The browser does that natively, so the round trip and the
`aspectRatios` state it needs are dropped — `next/image` with a fixed ratio and
`object-cover` gives the same result with none of the machinery.

`ponytail:` no swipe gestures on the carousel — autoplay plus dots, for a strip
that is usually one image. Add drag when there is a real carousel to drag.

### Block E · Profile & CV — 🟡 3 of 7 (screenshot received)

- [x] `/profile` — **reads from TWO sources**, because the app screen shows things
      that live apart:
      `ProfileContext.profile` is `{ id, name, rank, email, phone, location,
      avatarUrl, profileCompletion, maritimeProfile }` — **no education, no
      skills**. Those are on the **career profile**, a separate endpoint and
      context. Both contexts expose a key called `profile`, so they are aliased
      at the call site — the same shadowing class of bug as `isActive` in AppShell.
      Education entry shape came from the Mongoose schema (`institution`, `degree`,
      `fieldOfStudy`, `startDate`, `endDate`, `location`, `description`) because
      the test account has zero entries and it could not be read from live data.
- [x] `CareerProfileProvider` mounted — fetches at most once per session and only
      when a screen calls `load()`, so it costs nothing until Profile or CV asks
- [x] `education` icon added via `scripts/extract-icons.mjs`, aliased onto
      FontAwesome's `graduation-cap` — **63 icons** now

- [x] **Edit profile** — PersonalInformationScreen (231) as a MODAL, not a route
- [ ] `/profile/maritime` — MaritimeProfileEditScreen (345)

**Both Edit buttons on /profile navigated nowhere.** They linked to
`/profile/personal`, which has never existed here — and has no counterpart in
the app either: `PersonalInformationScreen` takes `onClose` / `onSaveSuccess`
and is mounted inside `PersonalInfoEditModal` → `AppBottomSheet`. So a modal is
the mirror, not a web shortcut, and it reuses the CV `EntryModal` shell.

**Two mismatches that made saving fail, both present in the app**

Verified against the live API, not inferred:

1. **Gender "Other" could never be saved.** `GENDER_OPTIONS` had `value: 'other'`;
   the service capitalises the first letter, and `user.validation.js` requires
   `Others`. `PATCH /user/profile {"gender":"Other"}` answers *"Gender must be
   Male, Female, or Others."* The value is now `'others'` — the label is still
   "Other". It also broke the READ path: the service lowercases the stored value
   to `'others'`, which matched no option, so the dropdown showed its
   placeholder for anyone already set that way.
2. **Marital status was missing two options.** The backend accepts
   Single/Married/Divorced/Widowed and the copy deck has all four; only the
   constant was short. A divorced or widowed user could not say so, and a stored
   value rendered as the placeholder.

Every one of the seven values now round-trips to an enum the server accepts.
**Both bugs are in the app's own constants file** and want the same fix there.

**Three field shapes that would have been easy to get wrong**

- `dob` is `"DD-MM-YYYY"` in BOTH directions — the service formats it that way
  on read and posts it verbatim as `dateOfBirth`. Confirmed the backend accepts
  it (`02-05-1990` → stored `1990-05-02`). DatePicker speaks `YYYY-MM-DD`, so it
  converts at that boundary and nowhere else, by splitting on the separator —
  `new Date("1990-05-02")` is UTC midnight and lands a day early west of
  Greenwich.
- `phone` holds only the LOCAL number. The dial code was split off at load and
  is re-attached on save, so it is shown locked beside the field; typing a
  country code there would double it.
- Email and nationality are read-only, as in the app — the hook does not even
  re-validate them, because there is nothing for the user to fix.

**Photo changes are staged.** Picking or removing touches nothing on the server;
`handleSave` applies whichever is pending first, so cancelling leaves the stored
photo intact. The preview has to be a local object URL — revoked when it changes
and on unmount, via a cleanup keyed on the value rather than a manual revoke at
each call site. `uploadProfilePhoto` also stopped deriving a name and mime from a
filesystem path: a File carries both, and `uri.split('/')` would have thrown on
one. Verified with a real `PATCH /user/profile-photo` — note PATCH, not POST.

The app's LocationField adds GPS and suggestions; this is a plain text field.
`currentLocation` is free text on the backend, and a geolocation prompt on a form
someone opened to type their city is the worse trade.
- [x] `/cv` — the career profile is ONE resolved document, and it holds **two
      kinds of section**, which decides what is editable:
      **NATIVE** (experience · education · skills · languages · references) are
      stored on it and edited via `addEntry` / `updateEntry` / `removeEntry`.
      **AGGREGATED** (personal · contact · maritime · certificates ·
      travelDocuments) are assembled live from the user profile and the
      documents store — **read-only here**, because editing Personal Details
      from this screen would write to the wrong place. Each links out to the
      screen that owns it.
- [x] **`EntryModal`** — add/edit for all four native sections in ONE
      parameterised component, which is the app's own choice and its own
      reasoning: the container logic is identical per section, only the fields
      differ. A dialog rather than a route is the shell decision the web gets to
      make; the app pushes a screen because a phone has nowhere else to put a
      form.

      Constraints copied, not invented — all from `careerProfile.model.js` and
      the app's `buildPayload()`:
      - field caps mirror the schema maxlengths, and **`name` cannot be one
        number**: skills caps at 100, languages at 50
      - `NO_HTML` is the backend's own `textSanitizer` rule, applied client-side
        so a bad paste is caught before a round trip
      - empty optional strings become **null**, not `""` — the schema defaults null
      - `endDate` is null whenever `isCurrent`, whatever the field holds
      - `responsibilities` is a newline-split **array**, trimmed, blanks dropped,
        max 15 lines × 300 chars
      - languages default to proficiency **Conversational**

      Form state is seeded lazily and reset by a **`key`** on the component
      rather than an effect syncing props into state — React's own answer to
      "reset when a prop changes", and it avoids the cascading render.
- [ ] `/cv/[section]` — CareerProfileEntryEditorScreen (432)
- [ ] `/cv/resume` — ResumeEditorScreen (447) + TemplateThumbnailPreview (342)
- [x] `/documents` — DocumentsScreen + its 6 components, in **3 files**. Verified
      end-to-end against the live API, not just rendered.
- [x] **PDF viewing landed here as planned** — a browser renders a PDF URL
      natively, so `<iframe>` replaces the whole `pdf` / `pdfCache` /
      `pdfDownload` chain (265 LOC) and `react-native-pdf`. No `URL.createObjectURL`
      either: the view URL carries its own token, so it can be used directly.

**The upload actually works — proven, not assumed**

Against `localhost:5000` with the seeded account: multipart POST returns a real
document, the view token serves the file, the same URL without a token is 401,
certificate metadata round-trips, a PDF into an image-only type is refused, and
both test documents were deleted afterwards.

Two things that only showed up by running it:
- **The server converts uploaded images to WebP.** `originalName` stays
  `passport.png` while `mimeType` becomes `image/webp`. The preview branches on
  `mimeType === 'application/pdf'`, so this is harmless — but branching on the
  file extension would have been wrong.
- **`grouped[docType.key]`** is keyed on `doc.category`, which is the document
  TYPE key. `item.id` is that key; `item.documentId` is the uploaded file's
  `_id` and is null until something is uploaded. Not interchangeable.

**The one line in the mirror that cannot match the app**

`documents.service.js` appended `{ uri, name, type }` — React Native's FormData
file shape. A browser stringifies that to `"[object Object]"` and multer sees no
file at all. The web appends the `File` itself. Everything else in the file is
untouched, and the explicit `multipart/form-data` header is deliberately left
alone: axios 1.x unsets it for FormData in a browser so the boundary is added
correctly. Setting it by hand *without* a boundary is the classic break here.

**Three rows collapse to one**

The app offers Take Photo / Choose from Gallery / Choose File because RN needs a
different native module for each. The browser has one file input, and its picker
already offers the camera as a source on Android and iOS — so it is one row,
with `accept` carrying the type's own rule (`pdf` → `application/pdf`, `image` →
jpeg/png/webp, `both` → either). The server enforces the same rule again, and
returns "Invalid file type." when it is violated.

**What is mirrored exactly, because each one prevents a real loss**

- Size is checked against **this type's** `maxSizeMB` before sending. multer's
  ceiling is a flat 20 MB for every type; the strict per-type check happens
  server-side only *after* the file has already been uploaded to temp.
- Replacing asks first and names the **new** file — a misclick otherwise
  overwrites a passport with the wrong scan and the old one is gone.
- `certificate` / `stcw` collect metadata **before** upload, once per pick, on
  every path. Without it a generated resume's Certificates section has the raw
  category name and blank issuer/expiry columns.
- Delete asks first, naming the document.

**Status is not a three-state yet.** `documents.service.js` derives it as
`existing ? Uploaded : Not Uploaded`, with its own comment saying there is no
admin-verification workflow. The Pending tab renders anyway, at 0, because it is
in the app and in the design — not because it was forgotten.

**Search refetches per keystroke.** The hook's effect refires on `searchQuery`
and `getDocuments()` hits the network again, even though the filtering is
client-side. That is the app's behaviour, left alone on purpose: document types
are cached in their service and stale responses are dropped by request id, so
the cost is chatter, not correctness.

Two web-only fixes with no app counterpart:
- `confirmReplace` sets `dismissible: false`. A native alert always resolves; a
  web dialog can be dismissed with Escape or a backdrop click, which would leave
  that promise pending forever.
- The file input is cleared before use. Picking the **same** file twice fires no
  change event otherwise, so a failed upload could not be retried with it.

3 icons added to `scripts/extract-icons.mjs` — `certificate`, `id-card`, `globe`
— **68 icons** now. These come from the admin's DocumentType rows rather than
from app source, which is why the original harvest missed them.

### Block F · Money — 🟡 3 of 5

- [x] `/subscription` — wired to the backend, `MOCKUP_TIERS` deleted
- [x] `/subscription/plan` — Razorpay web checkout, all three payment fallbacks
- [x] `/subscription/success`
- [x] `/wallet` — the missing half of the mid-subscription flow
- [ ] `/refer` — ReferEarn (427)

**Why the wallet is not a side feature**

Switching plans mid-term does not refund to a card. `subscription.service.js`
computes a prorated credit for the unused part of the current plan and puts it
on the summary as **"Unused Subscription Credit" — a NEGATIVE row** in
`priceBreakdown` (which is why /subscription/plan renders a negative amount as a
credit rather than looking for a field named for one). When that credit exceeds
the new plan's entire price, the leftover has no bill to come off, so
`activate()` deposits it here as `plan_switch_credit`, and the next purchase
auto-applies it as `walletApplied`.

Summary → wallet → next summary. Without this screen the middle step was
invisible: money left the visible flow and came back as a discount with nothing
to check it against. The deposit is fire-and-forget on the backend
("non-fatal"), so it can lag the subscription by a moment — reloading on mount
is what makes it appear.

`amount` is **signed paise**; `formatCurrency` divides by 100. Types are keyed on
the model's snake_case enum, and getting that wrong fails silently — the row just
prints the raw type string. `stats.totalDebited` is labelled "Total Spent"; the
field and the label do not share a name.

### Job alerts & saved jobs — audited against the app and the backend

- [x] **`/saved` remove was dead.** `handleRemoveJob` takes a job **ID** and does
      `allJobs.find((j) => j.id === jobId)`; `JobCard` already passes `job.id`.
      The page wrapped it as `() => handleRemoveJob(job)`, so `find()` compared an
      id to an object, never matched, and removing a saved job did nothing at
      all. The app passes the handler directly. Now it does too.
- [x] **`/alerts` was telling users the wrong thing.** It said "jobs matching the
      preferences on your profile" and linked to /preferences. Preferences are
      never read: `listJobAlertsForUser` takes the user's tier, expands it to
      every tier at or below it, and returns published jobs whose `minimumTier`
      is in that set. The app's own copy — "Jobs matching your subscription
      plan" — is now used verbatim.
- [x] **`/alerts` rendered two competing states.** The endpoint returns
      `{ jobs: [], total: 0 }` outright for anyone without an active
      subscription, so the page showed the upsell card AND fell through to "no
      matching jobs yet… update preferences" — two explanations at once, and a
      button that fixes neither. The app branches noSubscription → empty → list
      as one chain; so does this now, with search and pagination hidden while
      there is nothing they could act on.

**The notification is broader than the feed, and that is deliberate.**
`notifyEligibleUsersForJob` fans out on `$or` of TWO match reasons: an active
qualifying tier, **or** the job's category being in the user's
`preferredCategories` regardless of plan. So an unsubscribed user with a matching
category can be notified about a job this feed will not show them. That
asymmetry belongs to the backend — the feed is "jobs regarding my plan" by
design — and the no-plan card now explains the rule rather than pretending the
list is merely empty.

### Toasts — save/unsave feedback

- [x] `utils/toastRef.js` + `components/layout/ToastHost.jsx`, the same host-ref
      pattern as `alertRef`, kept separate on purpose: an alert is a modal that
      demands an answer, a toast is a confirmation you may ignore. Bookmarking is
      the second kind.
- [x] Raised from **`SavedJobsContext.toggleSaved`**, not from the call sites.
      Every save and unsave in the product routes through that one function —
      JobCard's bookmark on /jobs, /alerts, /dashboard and /saved, plus the Job
      Details button — so five copies would only drift apart.
- [x] It also fixes a **silent failure**: the optimistic update reverts and
      rethrows, but every caller swallows it with `.catch(() => {})`, so a failed
      save just made the bookmark quietly snap back with no explanation. There is
      now an error toast on both directions.
- 4 icons added (`user-friends`, `shopping-bag`, `sliders-h`, `exchange-alt`) —
      **72** now. The extractor's `textwrap` pass split hyphenated names across
      lines and silently tore `folder-open` and `info-circle` in half; it now
      wraps with `break_on_hyphens=False`.

**What the merged subscription PR actually shipped, and the four bugs in it**

The screen rendered, so it looked done. It was not wired to anything usable:

1. `MOCKUP_TIERS[plan.tier]` and the sort's `order[a.tier]` were keyed
   `Start`/`Premium`/`Elite`; the API sends **lowercase**. Every lookup missed →
   perks always `[]`, sort never ran. Deleted `MOCKUP_TIERS` outright: the API's
   own `features` are byte-identical, so the constant was pure drift risk.
2. It read `plan.price` / `plan.originalPrice`. `toCardPlan` produces
   `launchPrice` / `thenPrice` / `launchLabel` / `thenLabel`. Nothing rendered.
3. A hardcoded `₹` in `PlanCard` — the mapper already formats with the plan's own
   currency, so this would print `₹KWD 20.000` the day a Gulf plan is added.
4. "Save up to 30%" was hardcoded. The API says **20**. The page was advertising a
   discount that does not exist.

**`priceBreakdown` is an ARRAY, not an object**

`[{label,amount,kind}]` — charge rows plus one `kind:"total"` — and every amount
is in **minor units**. The first pass read it as `breakdown.baseLabel` /
`.payableValue`, so no lines rendered and the total fell through to the raw
`20000` where `₹200.00` belonged. On a checkout page. Rows are now rendered as
the server names them (a credit is a negative amount) rather than reconstructed
from fields that do not exist.

`formatMoney` asks `Intl` for the currency's minor units instead of the app's
hardcoded `/100`. Identical for INR; correct for KWD (3 places) and JPY (0),
which the hardcoded divisor gets 10x and 100x wrong.

**Three payment paths that look like edge cases and are not** — mirrored from
`usePlanSummary`:

- `summary.activated` → credit/wallet already covered it. **Skip Razorpay.**
  Opening a checkout for ₹0 fails.
- Checkout **error** ≠ payment failed. The webhook may have captured it — re-check
  `/me` before showing bad news.
- `verify()` failure ≠ payment failed either. The webhook is authoritative; verify
  is only the fast path. Re-check `/me`, and only then say "almost there".

Cancelling is silent and stays put — the order is still valid.

**`showAlert` was a silent no-op on the web.** Every copied hook and
`api/client.js` calls it; nothing had ever called `setAlertHost`. `AlertHost` is
now mounted in the app layout — so payment failures are visible instead of
swallowed.

**The summary crosses pages through an external store, not an effect.**
`createOrder` returns server-computed values that cannot be rebuilt from a URL,
and calling it again would open a **second order for one purchase**.
`useSyncExternalStore` over `sessionStorage` avoids the setState-in-effect that
flashed "choose a plan" for one frame at a paying user. `getSnapshot` caches the
raw string — returning a fresh `JSON.parse` each call renders forever.

### Error dialogs & responsiveness — audited across the web

**An alert could render with no message at all.** The screenshot was
"Could not open document" with an empty body — a title, an icon, and nothing
telling the user what went wrong. One call site (the consultancy resume preview)
passed `message: ""`.

Fixed at BOTH levels, because fixing only the caller leaves the next one free to
repeat it:
- that call site now uses `getErrorMessage(err)` like every other catch;
- **`AlertHost` falls back to `errors.generic`** when the message is missing or
  blank after trimming, so no caller can produce a wordless dialog again.

An audit of all 41 `showAlert` call sites found no others: `getErrorMessage`
always terminates at `errors.generic`, and the one mirror call that looked
message-less (`api/client.js`) is passing a shorthand variable.

**Modal had no height cap and no internal scroll.** It grew past the viewport and
the browser's own max-height clipped it — taking the footer, and the Save button
with it. The Personal Info form and a long Terms section both did this. It is now
a flex column with a bounded height, a fixed header and footer, and one scroll
container between them.

- **`dvh`, not `vh`** — on mobile Safari and Chrome `vh` is the tallest the
  viewport ever gets, so a `vh`-sized modal sits partly under the URL bar.
- Footer buttons **stack below ~380px**, reversed so the primary action stays
  nearest the thumb. "Cancel" + "Save Changes" side by side overflow a 320px
  sheet.
- `overscroll-contain`, so reaching the end of the body does not scroll the page
  behind the backdrop.

**That change would have clipped every dropdown inside a modal** — an absolutely
positioned panel is cut off by any ancestor that scrolls, and Personal Info alone
has two Selects and a DatePicker. So `useDropPlacement` now also returns the
trigger's rect and `dropStyle()` places panels with **`position: fixed`**, which
escapes ancestor overflow entirely. The same scroll/resize listeners that decide
the flip refresh the rect (capture:true, so the modal body's own scrolling
counts), and `left` is clamped to an 8px gutter so the 19rem calendar cannot hang
off a phone's right edge under a half-width field. `measure()` runs in the same
handler as `setOpen`, so both batch and there is no unpositioned first frame.

**The toast covered the mobile bottom nav.** Both sat at `bottom-4`; the toast
now clears the nav below `lg` and drops back down above it. It was also
`max-w-sm` — 24rem, wider than a 320px screen minus the stack's padding — so it
is capped at the available width, and its message wraps rather than overflowing.

**Long unbreakable content.** `adminNote` on a booking is where the meeting URL
lands, and a long link pushed the card wider than the screen; it and the
requirement text now wrap. Wallet reference IDs and profile values already did.

**The documents row was carrying four things on one line** — icon, three lines of
text, the status block, a chevron — leaving the name about 90px at 320px. The
status moves to its own row below `sm`, with the icon spanning both so the text
still starts at the same left edge.

The rest of the layout audit came back clean: one fixed pixel width in the whole
app (`w-[2px]`, a divider), every multi-column grid already has a responsive
base, `Tabs` already scrolls horizontally, and `AppShell` swaps the sidebar for a
bottom nav below `lg` with `min-w-0` on main.

### Block G · Support & settings — 🟡 5 of 8

- [x] `/consultancy` (**1,066**) · `/consultancy/bookings` (210)
- [ ] `/interview-prep` (259)
- [ ] `/notifications` (405) — the sidebar bell still points at this dead route
- [x] `/notifications/settings` (247)
- [x] `/settings` (131) · [ ] `/preferences` (203)
- [x] `/legal/privacy` · `/legal/terms` — public, static, Phase 5 SEO surface

**Consultancy is two steps, and the split is load-bearing**

Step 1 collects topic + date + time + requirement and calls `createOrder`, which
**reserves the slot** and creates the Razorpay order. Step 2 shows what was
reserved and is the only place checkout opens.

That is not decoration. The hold lasts `SLOT_HOLD_TTL_MS` — 15 minutes,
deliberately the same constant as an abandoned subscription checkout — so
reviewing and walking away just gets swept. And a cancelled or failed payment
**stays on step 2 against the same reservation**, so retrying does not mean
re-entering everything or grabbing a second slot.

Four cases that look like edge cases and are not, all mirrored from
`useConsultancy`:
- `PAYMENT_ALREADY_MADE` from createOrder is a **success** — a previous attempt
  went through; the user is sent to My Bookings.
- `SLOT_NOT_AVAILABLE` clears the chosen time and **reloads that date's slots**,
  because the stale list is what caused it.
- A checkout error is not proof the payment failed. `wasSlotBooked` re-reads the
  latest booking, and a booking only exists once payment is confirmed (backend
  `activateBooking`), so its presence settles it.
- A `verify()` failure is not proof either — the webhook is authoritative.

Verified live: fee `{amount: 500, currency: "USD"}`, availability returns 18
open dates for the month, a date returns 13 half-hour slots. **The fee is in
minor units** (500 → $5.00) like every other amount in this API, and the region
resolves the currency — so the hardcoded `₹` that was removed from PlanCard would
have been wrong here too.

Slots carry **no `id`** — a slot only becomes a real row once booked, which is
why `startTime` is both the key and the value the hook wants.

**`formatTime12h` is deliberately not Date/Intl.** The value is a wall-clock slot
time with no date and no zone; wrapping it in a Date invents both and then shifts
it for anyone whose offset disagrees. A 09:00 slot must read 9:00 AM everywhere.
The app defines this function twice, once per screen — it lives in `lib/time.js`
here instead of a third and fourth copy.

**Settings is a menu and stays one.** Four rows that navigate elsewhere: Wallet,
Notification Settings, Privacy Policy, Terms. No state, no fetch, no save — the
app's own comment says to add real settings here as they appear, and inventing
web-only switches that write nowhere would be worse than an honest short list.

**Notification settings toggles something real.** `pushNotificationsEnabled` is
selected explicitly by `notifyEligibleUsersForJob` when it fans out a new job, so
turning it off here silences the phone even though this build sends no push
itself. The app navigates back on save; there is no back stack on the web, so it
confirms with a toast and stays on the form.

**Legal pages are PUBLIC and static.** A legal document only a signed-in user can
read is not published; app stores and payment providers follow those links
without a session; and they are the Phase 5 SEO surface, which needs them
crawlable with no client JS. Both prerender at build time.

Their text was **extracted** from the app's PrivacyPolicyScreen /
TermsConditionsScreen into `constants/legal.content.js` (11 + 13 sections) rather
than retyped — a hand-copy of two legal documents is precisely where a silent
divergence appears. The app's own warning travels with it: this is placeholder
copy, not reviewed by counsel, and must be replaced in **both** places.

**Two more RN FormData uploads fixed** — the same root cause as documents:
`resume.service.js` and `personalInformation.service.js` (profile photo) both
appended `{ uri, name, type }`, which a browser stringifies to `"[object
Object]"`. That was every remaining file upload in the mirror; a grep for
`formData.append('file'` now returns three lines and all three are browser-shaped.

3 icons added (`shield-alt`, `file-contract`, `clock`) — **75** now.

### Not ported

`LanguageScreen` (274) — English only. Splash (9 components) — a web page has no
splash; the landing page is the first paint.

### Kit components each block will force into existence

Deferred in Phase 3 on purpose, built when the screen that needs them arrives:

| Block | Needs |
|---|---|
| A | `ReusableForm`, `DatePicker`, searchable `Select` (nationality/rank), OTP input |
| B | app shell — sidebar + glass bottom bar, `GlassCard`, carousel |
| C | two-pane shell, filter rail, `SearchBar` + suggestions |
| E | `ImageDropzone`, `ReusableTable`, PDF `<iframe>`, `TemplateThumbnailPreview` |
| G | `ActionMenu`, rich-text/legal page layout |

---

## Phase 5 · Public SEO surface — 4–5 days

All endpoints already public. No auth, no backend work.

- [ ] `/` landing
- [ ] `/jobs` — filterable, crawlable, paginated
- [ ] `/jobs/[id]/[slug]` — detail + `JobPosting` JSON-LD (Google Jobs)
- [ ] `/jobs/category/[cat]` — programmatic landing pages from public taxonomy
- [ ] `/jobs/rank/[rank]` — biggest organic lever for a job board
- [ ] `/legal/*` — fold in crewapply-site's 7 pages, then delete that repo
- [ ] `app/sitemap.js` + `app/robots.js`
- [ ] `revalidate = 300`. Skip `generateStaticParams` — job counts unknown, postings change daily
- [ ] Reuse `mapJobFromApi` from `job.service.js` server-side
- [ ] Map `employmentType` `"Full Time"` → Google's `FULL_TIME` enum (~5 lines)
- [ ] Derive slug from `title` — jobs have no `slug` field; match on `_id`

> ⚠️ **ISR is the rate-limit mitigation, not just a perf choice.** Anonymous requests
> bucket per IP at 600/15min (`ip:<addr>`), and every SSR fetch originates from the
> Vercel function's IP — **not** the visitor's. So all public traffic, Googlebot
> included, shares **one** 600-request budget. With `revalidate = 300` a given path
> hits the backend ≤12×/hour regardless of traffic, which stays far under the cap.
> Do not lower `revalidate` without doing this arithmetic. If it ever trips, the fix
> is one env var (`general.max`), still not backend code.

---

## Phase 6 · Polish & ship — 3–4 days

- [ ] Lighthouse pass
- [ ] `next/image` `remotePatterns` for the uploads host
- [ ] Real `<input type="file">` everywhere
- [ ] `revalidate` tuning
- [ ] Web push (optional)
- [ ] Deploy: Next on Vercel, backend stays on VPS behind nginx/PM2, CORS between
- [ ] **Prod env (the only backend-side work in the whole project — config, not code):**
      add the real web domain to `ALLOWED_ORIGINS`, and point `CLIENT_URL` at it so
      `/verify-email/:token` links resolve. Both already exist in `.env`; dev needs nothing.
- [ ] Keep PM2 at `instances: 1` / `exec_mode: 'fork'` — the rate limiter uses an
      in-memory store, so cluster mode silently multiplies every limit by the worker count

---

## 🔴 Bug ledger — the recurring shape

Every one of these was a value that looked right but belonged to a **different
moment or a different thing**. None were caught by the compiler.

| Bug | Cause |
|---|---|
| Cards collapsed to one word wide | `--spacing-sm` shadowed `--container-sm` in `max-w-*` |
| Focus ring drawn twice | `:focus-visible` unlayered, so it outranked every utility |
| Apply button full height | `className` cannot beat a component's own base class |
| Whole shell crashed | `const { isActive }` shadowed the `isActive()` nav helper |
| Subscribe CTA never appeared | gated on a `loading` flag that made it depend on a network round trip |
| Top bar snapped back | one symmetric 180ms easing doing both enter and exit |
| **Login bounced back to /login** | **`AuthGuard` state answered for the PREVIOUS route** |

The last one is the clearest case: on `/login` the check correctly resolved to
`anonymous`; sign-in stored tokens and navigated; both effects re-ran, but the
token re-read is a **promise** while the redirect effect is **synchronous** — so
it redirected on the stale answer. Fixed by storing the result **with the path it
was computed for**, so a result from another route cannot be acted on at all.

**The lesson, now a standing rule:** pair state with what it describes. Reading
`document.activeElement` during render, destructuring a name already in scope,
and caching an auth answer without its path are the same mistake three times.

Plus **9 shape mismatches** across the blocks (wrong field names, wrong method
names, wrong option shapes), zero caught by the build. JS + verbatim-copied hooks
means a green build only proves names *resolve*, not that they *mean* anything.

---

## Reference

| | |
|---|---|
| Copied near-verbatim | ~6,700 LOC — services, hooks, contexts, api, constants, utils |
| Written fresh | ~28,300 LOC of web UI |
| Component behavior from admin | 14 |
| Backend code written | 0 |
| Dropped with multi-language | 7,904 LOC |

**Known trade-offs**
- English-only launch is fine, but `/[lang]/` retrofit is a restructure, not an addition.
  Crew audience is largely Filipino / Indian / Chinese / Arabic-speaking.
- Mobile web will carry most traffic — the app's phone design is the mobile reference
  almost pixel-for-pixel. Desktop is the expansion.
