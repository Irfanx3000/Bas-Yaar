/* ─────────────────────────────────────────────────────────────────────────────
   Theme reference — the Phase 1 fidelity gate.

   Every token in globals.css is rendered here so it can be held up against the
   running mobile app before any screen work starts. Server component, no JS:
   what you see is what the CSS produces.

   To compare 1:1, set the viewport to 375px — the app's own design baseline.
   The type scale is fluid, so at any wider viewport sizes read larger by design.
   ───────────────────────────────────────────────────────────────────────────── */

export const metadata = {
  title: "Theme reference",
  robots: { index: false, follow: false },
};

const PRIMARY = [
  ["primary", "#056DEC", "primary.main"],
  ["primary-light", "#EFF5FF", "primary.light"],
  ["primary-tint", "#E4EFFD", "primary.tint"],
  ["primary-accent", "#4289F7", "primary.accent"],
  ["primary-vivid", "#1C55E8", "primary.vivid"],
  ["primary-dark", "#1962BA", "primary.dark"],
];

const SECONDARY = [
  ["secondary", "#FD7C03", "secondary.main"],
  ["secondary-light", "#FEF0E7", "secondary.light"],
  ["secondary-tint", "#FFEFDB", "secondary.tint"],
  ["secondary-dark", "#D77B19", "secondary.dark"],
];

const SURFACES = [
  ["canvas", "#CCE2FA", "background.default"],
  ["canvas-top", "#F4F6F6", "background.gradientStart"],
  ["surface", "#FFFFFF", "background.paper"],
  ["header", "#0D3E85", "background.header"],
  ["navy-deep", "#081B33", "splash.navyDeep"],
];

const TEXT = [
  ["heading", "#1E1E1E", "text.primary"],
  ["body", "#556172", "text.secondary"],
  ["muted", "#595959", "text.muted"],
  ["hint", "#727272", "text.hint"],
  ["placeholder", "#7D7D7D", "text.placeholder"],
];

const STATUS = [
  ["success", "#0FA66A", "status.success.main"],
  ["success-light", "#E2F5EB", "status.success.light"],
  ["warning", "#FD7C03", "status.warning.main"],
  ["warning-light", "#FEF0E7", "status.warning.light"],
  ["info", "#1C55E8", "status.info.main"],
  ["info-light", "#E8EEFD", "status.info.light"],
  ["danger", "#EC0509", "status.danger.main"],
  ["danger-light", "rgba(236,5,9,.2)", "status.danger.light"],
  ["accent", "#483FF6", "status.accent.main"],
  ["accent-light", "#EDEDFD", "status.accent.light"],
];

const LINES = [
  ["line", "#D9D9D9", "border.main"],
  ["line-soft", "rgba(183,218,255,.35)", "border.light"],
  ["line-mint", "#C6ECE8", "border.mint"],
  ["line-input", "#E2E8F0", "border.input"],
  ["nav-inactive", "#5B6475", "navInactive"],
];

const TYPE = [
  ["display", "text-display", "33 → 56", "font-extrabold"],
  ["h1", "text-h1", "30 → 46", "font-bold"],
  ["h2", "text-h2", "24 → 32", "font-bold"],
  ["h3 / xxl", "text-h3", "20 → 24", "font-semibold"],
  ["xl", "text-xl", "18 → 20", "font-semibold"],
  ["lg", "text-lg", "16 → 17", "font-medium"],
  ["md — body default", "text-md", "14 → 15", "font-normal"],
  ["sm", "text-sm", "12 → 13", "font-normal"],
  ["nav", "text-nav", "11 → 12", "font-medium"],
  ["xs", "text-xs", "10 → 12", "font-normal"],
];

/* [app token, px, the Tailwind class to write]. There are no --spacing-*
   tokens on purpose — see the long note in globals.css. */
const SPACING = [
  ["xxs", 2, "0.5"],
  ["xs", 5, "[5px]"],
  ["sm", 8, "2"],
  ["base", 10, "2.5"],
  ["md", 12, "3"],
  ["lg", 16, "4"],
  ["xl", 20, "5"],
  ["xxl", 24, "6"],
  ["xxxl", 32, "8"],
  ["layout.gutter", 12, "3"],
  ["layout.screenHMargin", 15, "[15px]"],
];

const RADIUS = [
  ["xs", "5px"],
  ["sm", "8px"],
  ["md", "10px"],
  ["lg", "16px"],
  ["xl", "20px"],
  ["xxl", "25px"],
  ["pill", "43px"],
];

const SHADOWS = [
  ["sm", "0 2px 4px rgba(0,0,0,.25)", "menu items, small cards"],
  ["md", "0 2px 7px rgba(0,0,0,.25)", "standard cards"],
  ["lg", "0 2px 9px rgba(0,0,0,.25)", "prominent cards"],
  ["float", "0 0 6.2px rgba(0,0,0,.14)", "glass bottom nav"],
  ["glow", "0 2px 10.7px rgba(20,59,113,.7)", "profile strength"],
];

const GRADIENTS = [
  ["primary", "#056DEC → #1962BA", "primary buttons"],
  ["secondary", "#FE7802 → #E87C1C", "accent buttons"],
  ["header", "#2252A3 → #0E2D63", "profile / header cards"],
  ["canvas", "#F4F6F6 → #CCE2FA", "page background"],
  ["splash", "#081B33 → #1C55E8", "splash screen"],
];

const MOTION = [
  ["fast", "180ms", "press feedback"],
  ["base", "280ms", "entrances, fades"],
  ["sheet", "300ms", "sheets, sidebar"],
  ["slow", "420ms", "large reveals"],
];

function Section({ id, title, note, children }) {
  return (
    <section id={id} className="scroll-mt-5">
      <h2 className="text-h3 font-bold text-heading">{title}</h2>
      {note ? <p className="mt-[5px] max-w-prose text-sm text-body">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Swatch({ name, hex, appName }) {
  return (
    <div className="overflow-hidden rounded-md border border-line-soft bg-surface">
      <div className="h-14 w-full" style={{ background: `var(--color-${name})` }} />
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-heading">{name}</p>
        <p className="mt-0.5 font-mono text-xs text-body">{hex}</p>
        <p className="mt-0.5 text-xs text-hint">{appName}</p>
      </div>
    </div>
  );
}

function Swatches({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(([name, hex, appName]) => (
        <Swatch key={name} name={name} hex={hex} appName={appName} />
      ))}
    </div>
  );
}

export default function ThemePage() {
  return (
    <main className="mx-auto max-w-6xl px-[15px] py-8">
      <header className="max-w-prose">
        <h1 className="text-h1 font-extrabold text-heading">Theme reference</h1>
        <p className="mt-3 text-lg text-body">
          Every token ported from the mobile app, rendered by the same CSS the product
          will use. Hold this against a running build of the app before any screen work
          begins.
        </p>
        <p className="mt-3 rounded-md border border-line-mint bg-surface px-3 py-2 text-sm text-body">
          Set the viewport to <strong className="font-bold text-heading">375px</strong> to
          compare 1:1 — that is the app&apos;s design baseline, where every size below
          matches it exactly. Type is fluid, so wider viewports read larger on purpose.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <Section
          id="colour"
          title="Colour"
          note="Hex values copied verbatim from the app. The third line on each swatch is the app-side token path."
        >
          <div className="space-y-5">
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted">Primary</h3>
              <Swatches items={PRIMARY} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted">Secondary</h3>
              <Swatches items={SECONDARY} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted">Surfaces</h3>
              <Swatches items={SURFACES} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted">Text</h3>
              <Swatches items={TEXT} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted">Status</h3>
              <Swatches items={STATUS} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted">Lines</h3>
              <Swatches items={LINES} />
            </div>
          </div>
        </Section>

        <Section
          id="type"
          title="Typography — Manrope"
          note="Sizes are clamp()ed between the app value at 375px and a desktop value at 1440px. Line heights are the app's own ratios, so they track the clamp."
        >
          <div className="divide-y divide-line-soft rounded-lg border border-line-soft bg-surface">
            {TYPE.map(([label, cls, range, weight]) => (
              <div
                key={label}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <p className={`${cls} ${weight} text-heading`}>
                  Second Engineer, Bulk Carrier
                </p>
                <p className="shrink-0 font-mono text-xs text-hint">
                  {label} · {range}px
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-line-soft bg-surface p-4">
            <p className="mb-3 font-mono text-xs text-hint">weights 400 / 500 / 600 / 700 / 800</p>
            <div className="space-y-[5px] text-xl text-heading">
              <p className="font-normal">Regular — the app bundles Manrope-Regular</p>
              <p className="font-medium">Medium — Manrope-Medium</p>
              <p className="font-semibold">SemiBold — Manrope-SemiBold</p>
              <p className="font-bold">Bold — Manrope-Bold</p>
              <p className="font-extrabold">ExtraBold — Manrope-ExtraBold</p>
            </div>
          </div>
        </Section>

        <Section
          id="spacing"
          title="Spacing"
          note="Raw values from spacing.js — moderateScale() is the identity function at the app's 375px baseline, so these are exact. There are no spacing tokens: Tailwind's numeric scale already is this scale. The right-hand column is the class to write."
        >
          <div className="space-y-2 rounded-lg border border-line-soft bg-surface p-4">
            {SPACING.map(([name, px, cls]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-44 shrink-0 font-mono text-xs text-hint">{name}</span>
                <span className="h-3 shrink-0 rounded-xs bg-primary" style={{ width: px }} />
                <span className="w-12 shrink-0 font-mono text-xs text-body">{px}px</span>
                <span className="font-mono text-xs text-primary-vivid">p-{cls}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="radius" title="Radius">
          <div className="flex flex-wrap gap-4">
            {RADIUS.map(([name, px]) => (
              <div key={name} className="text-center">
                <div
                  className="size-20 border border-line bg-primary-tint"
                  style={{ borderRadius: `var(--radius-${name})` }}
                />
                <p className="mt-2 font-mono text-xs text-body">{name}</p>
                <p className="font-mono text-xs text-hint">{px}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="shadows" title="Shadows" note="Copied from the Figma boxShadow values quoted in shadows.js, not converted from the React Native shadow props.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SHADOWS.map(([name, css, use]) => (
              <div key={name} className="p-[5px]">
                <div
                  className="rounded-lg bg-surface p-4"
                  style={{ boxShadow: `var(--shadow-${name})` }}
                >
                  <p className="text-md font-semibold text-heading">shadow-{name}</p>
                  <p className="mt-0.5 text-sm text-body">{use}</p>
                </div>
                <p className="mt-2 font-mono text-xs text-hint">{css}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="gradients" title="Gradients" note="React Native's LinearGradient defaults to top→bottom, so every one of these is 180deg.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GRADIENTS.map(([name, stops, use]) => (
              <div key={name} className="overflow-hidden rounded-lg border border-line-soft bg-surface">
                <div className={`h-24 bg-gradient-${name}`} />
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-heading">bg-gradient-{name}</p>
                  <p className="mt-0.5 font-mono text-xs text-body">{stops}</p>
                  <p className="mt-0.5 text-xs text-hint">{use}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="glass"
          title="Glass"
          note="The floating bottom nav. blur(15px) is the app's own blurAmount. Sitting on a gradient so the blur is actually visible — on a flat colour it looks like plain translucency."
        >
          <div className="bg-gradient-header relative overflow-hidden rounded-lg p-8">
            <p className="text-xl font-bold text-white">Behind the glass</p>
            <p className="mt-[5px] text-md text-white/80">
              Anything here should read as blurred through the panel below.
            </p>
            <div className="glass mt-5 rounded-xxl px-4 py-3 shadow-float">
              <p className="text-md font-semibold text-heading">glass · shadow-float</p>
              <p className="mt-0.5 text-sm text-body">rgba(255,255,255,.58) + blur(15px)</p>
            </div>
          </div>
        </Section>

        <Section id="motion" title="Motion" note="Durations and easings from motion.js. Press the card to see the scale token; springs are approximated with the standard cubic-bezier.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line-soft bg-surface p-4">
              {MOTION.map(([name, ms, use]) => (
                <div key={name} className="flex items-baseline justify-between py-[5px]">
                  <span className="font-mono text-xs text-body">--duration-{name}</span>
                  <span className="text-sm text-heading">
                    {ms} <span className="text-hint">· {use}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <button
                type="button"
                className="bg-gradient-primary press w-full rounded-pill px-6 py-3 text-md font-bold text-on-primary shadow-md"
              >
                Press me — scale 0.96
              </button>
              <div className="press-card rounded-lg bg-surface p-4 shadow-md">
                <p className="text-md font-semibold text-heading">Card press — scale 0.985</p>
                <p className="mt-0.5 text-sm text-body">
                  Deliberately subtle. Cards should settle, not jump.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="composed"
          title="Composed"
          note="Tokens doing a real job, so proportions can be judged rather than swatches. This is not a finished component — those are Phase 3."
        >
          <div className="max-w-md rounded-lg bg-surface p-4 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-heading">Second Engineer</p>
                <p className="mt-0.5 text-sm text-body">Maersk Line · Bulk Carrier</p>
              </div>
              <span className="rounded-pill bg-secondary-light px-3 py-0.5 text-xs font-bold text-warning-text">
                Urgent
              </span>
            </div>
            <p className="mt-3 text-md font-bold text-primary">
              $4,200 - $5,600 <span className="text-sm font-medium text-hint">/ month</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-[5px]">
              {["Full Time", "Engine", "12 months"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-pill bg-primary-tint px-3 py-0.5 text-xs font-semibold text-primary-vivid"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="bg-gradient-primary press flex-1 rounded-pill py-2 text-md font-bold text-on-primary shadow-sm"
              >
                Apply now
              </button>
              <button
                type="button"
                className="press rounded-pill border border-line-input px-4 py-2 text-md font-semibold text-body"
              >
                Save
              </button>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
