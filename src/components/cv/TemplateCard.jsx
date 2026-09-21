"use client";

import { Icon } from "@/components/ui";

/* One template in the resume editor's gallery — the app's TemplateCard +
 * TemplateThumbnailPreview.
 *
 * No template ships a thumbnail image (seedResumeTemplates.js leaves
 * thumbnailUrl null), so the card DRAWS the template from its own `layout`
 * config: header style, banner, sidebar band, colours, photo. It reads the same
 * config the PDF renderer does, so the card cannot drift from what Generate
 * produces, and an admin recolouring a template updates every card at once.
 *
 * Scaling: the app authors the mock-up at 120×156 and applies one transform
 * scale. Here every dimension is written in container-query units instead —
 * u(10) is "10 design px" as a fraction of the card's own width — so the whole
 * page scales with the card in plain CSS, with no measuring and no JS resize.
 *
 * Everything is a <span> (display set inline) because the card is a <button>,
 * and a button may only contain phrasing content.
 */

const DESIGN_WIDTH = 120;
const DESIGN_HEIGHT = 156;
const u = (v) => `${(v * 100) / DESIGN_WIDTH}cqw`;

const col = { display: "flex", flexDirection: "column" };

function Bar({ style }) {
  return <span style={{ display: "block", borderRadius: u(2), flexShrink: 0, ...style }} />;
}

function Line({ color, width }) {
  return (
    <span
      style={{
        display: "block",
        height: u(2.5),
        borderRadius: u(1.5),
        marginBottom: u(3),
        opacity: 0.55,
        backgroundColor: color,
        width,
      }}
    />
  );
}

function Photo({ header, size, radius, fill, style }) {
  return (
    <span
      style={{
        display: "block",
        flexShrink: 0,
        boxSizing: "border-box",
        width: u(size),
        height: u(size),
        borderRadius: header.photoShape === "square" ? u(2) : u(radius),
        backgroundColor: fill,
        border: header.photoRingWidth ? `${u(1.5)} solid ${header.photoRingColor || "#FFFFFF"}` : "none",
        ...style,
      }}
    />
  );
}

const nameText = (color) => ({
  display: "block",
  fontSize: u(11),
  fontWeight: 700,
  lineHeight: 1.2,
  marginBottom: u(3),
  color,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export function TemplateThumbnailPreview({ layout }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        containerType: "inline-size",
        width: "100%",
        aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
        overflow: "hidden",
      }}
    >
      <span style={{ ...col, height: "100%" }}>
        <TemplatePreviewBody layout={layout} />
      </span>
    </span>
  );
}

function TemplatePreviewBody({ layout }) {
  const isTwoColumn = (layout?.columns?.left || []).length > 0;
  const body = isTwoColumn ? <TwoColumnPreview layout={layout} /> : <SingleColumnPreview layout={layout} />;

  /* A coloured header band is the most recognisable thing about the templates
     that have one — drawn above whichever body shape, as the renderer paints it. */
  const banner = layout?.page?.banner;
  if (!banner?.enabled) return body;

  const header = layout?.header || {};
  const colors = layout?.colors || {};
  const sidebar = layout?.page?.sidebar || {};
  const bannerText = colors.bannerText || "#FFFFFF";
  const bannerMuted = colors.bannerMuted || "#D6DEEA";

  // Mirrors pageBands()'s 'main' span: a banner can stop at the sidebar edge.
  const insetRatio = banner.span === "main" && sidebar.enabled ? sidebar.widthRatio || 0.35 : 0;
  const onLeft = sidebar.side !== "right";

  return (
    <span style={{ ...col, flex: 1, minHeight: 0, backgroundColor: colors.background || "#FFFFFF" }}>
      <span
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          boxSizing: "border-box",
          padding: `0 ${u(7)}`,
          gap: u(6),
          backgroundColor: banner.color || "#0D3E85",
          height: `${(banner.heightRatio || 0.16) * 100}%`,
          marginLeft: onLeft ? `${insetRatio * 100}%` : 0,
          marginRight: onLeft ? 0 : `${insetRatio * 100}%`,
          flexDirection: header.photoSide === "right" ? "row-reverse" : "row",
        }}
      >
        {header.showPhoto ? <Photo header={header} size={26} radius={13} fill={bannerMuted} /> : null}
        <span style={{ ...col, flex: 1, minWidth: 0, justifyContent: "center" }}>
          <Bar style={{ backgroundColor: bannerText, width: "76%", height: u(4.5), marginBottom: u(3) }} />
          <Bar style={{ backgroundColor: bannerMuted, width: "48%", height: u(2.5) }} />
        </span>
      </span>
      <span style={{ ...col, flex: 1, minHeight: 0 }}>{body}</span>
    </span>
  );
}

// ── Two-column / sidebar ─────────────────────────────────────────────────────
function TwoColumnPreview({ layout }) {
  const colors = layout?.colors || {};
  const header = layout?.header || {};
  const sidebar = layout?.page?.sidebar || {};
  const columns = layout?.columns || {};

  const bandOn = !!sidebar.enabled;
  const leftRatio = columns.leftRatio || sidebar.widthRatio || 0.35;
  const onLeft = sidebar.side !== "right";

  // Inside the band takes the sidebar colours; everything else the document's.
  const bandBg = bandOn ? sidebar.color || "#2B303B" : "transparent";
  const bandText = bandOn ? colors.sidebarText || "#FFFFFF" : colors.primary || "#1E1E1E";
  const bandAccent = bandOn ? colors.sidebarAccent || "#4A90E2" : colors.secondary || "#556172";
  const bandMuted = bandOn ? colors.sidebarMuted || "#AEB6C4" : colors.muted || "#B0B6BD";

  const primary = colors.primary || "#1E1E1E";
  const secondary = colors.secondary || "#556172";
  const muted = colors.muted || "#B0B6BD";
  const headerInSidebar = header.placement === "sidebar";

  // Only a handful of stubs fit at this size — the shape is the point.
  const leftSections = (columns.left || []).slice(0, 4);
  const rightSections = (columns.right || []).slice(0, 3);

  const band = (
    <span
      style={{
        ...col,
        alignItems: "center",
        flexShrink: 0,
        boxSizing: "border-box",
        width: `${leftRatio * 100}%`,
        padding: `${u(9)} ${u(6)} 0`,
        backgroundColor: bandBg,
      }}
    >
      {headerInSidebar ? (
        <span style={{ ...col, alignItems: "center", width: "100%", marginBottom: u(8) }}>
          {header.showPhoto ? (
            <Photo header={header} size={22} radius={11} fill={bandMuted} style={{ marginBottom: u(4) }} />
          ) : null}
          <Bar style={{ backgroundColor: bandText, width: "78%", height: u(4), marginBottom: u(2.5) }} />
          <Bar style={{ backgroundColor: bandAccent, width: "52%", height: u(2.5) }} />
        </span>
      ) : null}

      {leftSections.map((key) => (
        <span key={key} style={{ display: "block", width: "100%", marginBottom: u(6) }}>
          <Bar style={{ backgroundColor: bandText, width: "62%", height: u(3), marginBottom: u(3), opacity: 0.95 }} />
          <Line color={bandMuted} width="92%" />
          <Line color={bandMuted} width="74%" />
        </span>
      ))}
    </span>
  );

  const main = (
    <span style={{ display: "block", flex: 1, minWidth: 0, boxSizing: "border-box", padding: `${u(9)} ${u(7)} 0` }}>
      {!headerInSidebar ? (
        <span style={{ display: "block", marginBottom: u(7) }}>
          <span style={nameText(primary)}>John Smith</span>
          <Bar style={{ backgroundColor: secondary, width: u(40), height: u(3) }} />
        </span>
      ) : null}

      {rightSections.map((key, i) => (
        <span key={key} style={{ display: "block", width: "100%", marginBottom: u(6) }}>
          <Bar style={{ backgroundColor: primary, width: "48%", height: u(3.5), marginBottom: u(3.5) }} />
          <Line color={muted} width="96%" />
          <Line color={muted} width="88%" />
          {i === 0 ? <Line color={muted} width="70%" /> : null}
        </span>
      ))}
    </span>
  );

  return (
    <span style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0, backgroundColor: colors.background || "#FFFFFF" }}>
      {onLeft ? band : main}
      {onLeft ? main : band}
    </span>
  );
}

// ── Single column ────────────────────────────────────────────────────────────
function SingleColumnPreview({ layout }) {
  const colors = layout?.colors || {};
  const header = layout?.header || {};
  const divider = layout?.divider || {};

  const primary = colors.primary || "#1E1E1E";
  const secondary = colors.secondary || "#556172";
  const muted = colors.muted || "#B0B6BD";
  const isBanner = header.style === "banner";

  return (
    <span
      style={{
        display: "block",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: `${u(12)} ${u(10)}`,
        backgroundColor: colors.background || "#FFFFFF",
      }}
    >
      <span
        style={{
          ...col,
          alignItems: header.style === "left" ? "flex-start" : "center",
          marginBottom: u(6),
          ...(isBanner ? { backgroundColor: primary, margin: `0 ${u(-10)} ${u(6)}`, padding: `0 ${u(10)}` } : null),
        }}
      >
        <span style={{ ...nameText(isBanner ? "#FFFFFF" : primary), maxWidth: "100%" }}>John Smith</span>
        <Bar style={{ backgroundColor: isBanner ? "rgba(255,255,255,0.6)" : secondary, width: u(46), height: u(3) }} />
      </span>

      {divider.style !== "none" ? (
        <span
          style={{
            display: "block",
            margin: `${u(6)} 0`,
            borderTop: `${u(1)} ${divider.style === "dots" ? "dotted" : "solid"} ${divider.color || muted}`,
          }}
        />
      ) : null}

      {[0, 1, 2].map((section) => (
        <span key={section} style={{ display: "block", marginBottom: u(7) }}>
          <Bar style={{ backgroundColor: secondary, width: "34%", height: u(4), marginBottom: u(4), opacity: 0.85 }} />
          <Line color={muted} width="90%" />
          <Line color={muted} width="70%" />
          {section === 0 ? <Line color={muted} width="80%" /> : null}
        </span>
      ))}
    </span>
  );
}

export function TemplateCard({ template, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group min-w-0 cursor-pointer text-left"
    >
      <span
        className={`relative block overflow-hidden rounded-md border-2 bg-surface shadow-sm transition-colors duration-[180ms] ease-standard ${
          selected ? "border-primary" : "border-transparent group-hover:border-primary/40"
        }`}
      >
        {template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-set arbitrary host, same as the app's <Image uri>
          <img
            src={template.thumbnailUrl}
            alt=""
            className="block w-full object-cover"
            style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
          />
        ) : (
          <TemplateThumbnailPreview layout={template.layout} />
        )}
        {selected ? (
          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-round bg-primary text-on-primary">
            <Icon name="check" size={10} />
          </span>
        ) : null}
      </span>
      <span className="mt-1 block truncate text-center text-sm font-semibold text-heading">{template.name}</span>
    </button>
  );
}
