"use client";

/* Component kit reference — the Phase 3 review surface.
 *
 * Every primitive, in every state that matters, on the app's own background.
 * Sits beside /theme: that page proves the tokens, this one proves what is
 * built from them.
 */

import { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmationModal,
  EmptyState,
  ErrorState,
  Icon,
  InlineAlert,
  Input,
  JobCard,
  LoadingState,
  Modal,
  Pagination,
  ProgressBar,
  SectionTitle,
  Select,
  StatusBadge,
  Tabs,
} from "@/components/ui";
import { ICON_PATHS } from "@/components/ui/icon-paths";

const SAMPLE_JOB = {
  id: "1",
  title: "Second Engineer — Bulk Carrier",
  companyName: "Maersk Line",
  salary: "$4,200 - $5,600",
  salaryUnit: "/ month",
  location: "Mumbai, India",
  type: "Full Time",
  logo: null,
  isFeatured: true,
  urgent: true,
  minimumTier: "premium",
};

function Row({ title, note, children }) {
  return (
    <section className="mt-8">
      <SectionTitle>{title}</SectionTitle>
      {note ? <p className="mt-[5px] max-w-prose text-sm text-body">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function KitPage() {
  const [tab, setTab] = useState("open");
  const [page, setPage] = useState(3);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dept, setDept] = useState("");
  const [vessel, setVessel] = useState("");

  return (
    <main className="mx-auto max-w-5xl px-[15px] py-8">
      <h1 className="text-h1 font-extrabold text-heading">Component kit</h1>
      <p className="mt-3 max-w-prose text-lg text-body">
        Built on the Phase 1 tokens and measured against the app&apos;s own components —
        AppButton, AppInput, AppCard, StatusBadge. Buttons are 10px radius, not pills.
        Cards carry the 1px soft-blue stroke.
      </p>

      <Row title="Buttons" note="Solid uses the primary gradient. Outline is 1.5px. Text has no padding. Disabled solid goes flat grey with hint text, exactly as AppButton does.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Apply now</Button>
          <Button tone="secondary">Upgrade plan</Button>
          <Button variant="outline">Save job</Button>
          <Button variant="outline" tone="danger">Withdraw</Button>
          <Button variant="text">Skip</Button>
          <Button icon="paper-plane">Send</Button>
          <Button icon="arrow-right" iconPosition="right">Continue</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-3 max-w-sm">
          <Button fullWidth>Full width</Button>
        </div>
      </Row>

      <Row title="Inputs" note="50px min height, 12px radius — an arbitrary value on purpose, because the app says no radius token equals 12.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Email or phone" placeholder="you@example.com" icon="email" />
          <Input label="Password" type="password" placeholder="••••••••" icon="lock" />
          <Input label="Rank" placeholder="Second Engineer" hint="As printed on your CDC." />
          <Input label="Passport number" defaultValue="X1234" error="Passport number must be 8 characters." />
          <Select
            label="Department"
            placeholder="Choose a department"
            options={["Deck", "Engine", "Catering", "Hospitality", "Electrical", "Deck Cadet", "Galley"]}
            value={dept}
            onChange={setDept}
          />
          <Select
            label="Vessel type"
            options={["Bulk Carrier", "Tanker", "Container", "LNG Carrier", "Passenger Ferry"]}
            value={vessel}
            onChange={setVessel}
            error={vessel ? undefined : "Pick one to continue."}
          />
        </div>
      </Row>

      <Row
        title="Job card"
        note="A media tile: a 16:9 image band holds ~47% of the height at any column width, with the save control on the title row rather than floating over the image. Titles of different lengths still leave the salary and button on the same baseline — the footer is pinned with mt-auto and the tile fills the grid row's height."
      >
        <div className="grid-cards">
          <JobCard job={SAMPLE_JOB} saved={saved} onToggleSave={() => setSaved((s) => !s)} />
          <JobCard
            job={{ ...SAMPLE_JOB, id: "2", title: "Able Seaman", isFeatured: false, urgent: false, minimumTier: "start" }}
            applied
          />
          <JobCard
            job={{
              ...SAMPLE_JOB,
              id: "3",
              title: "Chief Officer — Very Large Crude Carrier, Deep Sea",
              isFeatured: false,
              urgent: true,
              minimumTier: "sail",
              salary: "",
              location: "Singapore",
              /* A real uploaded logo, served cross-origin by the API, so the
                 image band can be judged with actual artwork rather than only
                 the fallback. NOTE: no job in the database currently has a
                 company.logoUrl, so today every production tile renders the
                 fallback — see PROGRESS.md. */
              logo: "uploads/company/28987a57-4f52-49e1-982a-c15ea21edd3f.webp",
            }}
          />
        </div>
      </Row>

      <Row title="Badges and chips">
        <div className="flex flex-wrap items-center gap-2">
          {["featured", "applied", "interview", "selected", "under_review", "rejected"].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Chip>Full Time</Chip>
          <Chip tone="neutral">Engine</Chip>
          <Chip tone="success">Verified</Chip>
          <Chip tone="warning">Expiring</Chip>
          <Chip onRemove={() => {}}>Bulk Carrier</Chip>
        </div>
      </Row>

      <Row title="Avatar and progress">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Irfan Shaikh" size="sm" />
          <Avatar name="Irfan Shaikh" />
          <Avatar name="Irfan Shaikh" size="lg" />
          <Avatar size="xl" />
        </div>
        <div className="mt-4 max-w-sm">
          <ProgressBar value={68} label="Profile strength" />
        </div>
      </Row>

      <Row title="Tabs and pagination">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "open", label: "Open", count: 12 },
            { value: "review", label: "Under review", count: 3 },
            { value: "closed", label: "Closed" },
          ]}
        />
        <p className="mt-3 text-sm text-body">Selected: {tab} — arrow keys move between tabs.</p>
        <Pagination className="mt-4" page={page} totalPages={24} onChange={setPage} />
      </Row>

      <Row title="Feedback" note="Errors say what happened and offer the fix. Empty states invite an action rather than just reporting emptiness.">
        <div className="space-y-3">
          <InlineAlert tone="info" title="Your CDC expires in 41 days">Renew it before applying to contracts starting after March.</InlineAlert>
          <InlineAlert tone="success" title="Application sent">Maersk Line will see it within a day.</InlineAlert>
          <InlineAlert tone="warning" title="Profile incomplete">Add your rank to appear in employer searches.</InlineAlert>
          <ErrorState message="We couldn't reach the server." onRetry={() => {}} />
        </div>
        <Card className="mt-4">
          <EmptyState
            icon="bookmark"
            title="No saved jobs yet"
            message="Tap the bookmark on any job to keep it here."
            action={<Button>Browse jobs</Button>}
          />
        </Card>
        <div className="mt-4 max-w-2xl">
          <LoadingState rows={2} />
        </div>
      </Row>

      <Row title="Modals" note="A centred dialog from 640px up, a bottom sheet below it — built on <dialog>, so focus trapping and Escape come from the browser.">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="outline" tone="danger" onClick={() => setConfirmOpen(true)}>Delete account</Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Contact support"
          footer={<><Button variant="text" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => setModalOpen(false)}>Send</Button></>}
        >
          <Input label="What do you need help with?" placeholder="Describe the issue" />
        </Modal>
        <ConfirmationModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          destructive
          title="Delete your account?"
          message="This removes your profile, documents and application history. It cannot be undone."
          confirmLabel="Delete account"
        />
      </Row>

      <Row title={`Icons — ${Object.keys(ICON_PATHS).length} from FontAwesome`} note="The same glyphs the app draws, extracted as path data so there is no icon dependency at runtime. Names match the app's.">
        <Card>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {Object.keys(ICON_PATHS).map((name) => (
              <div key={name} className="flex flex-col items-center gap-1 text-center">
                <Icon name={name} size={18} className="text-heading" />
                <span className="font-mono text-[10px] leading-tight break-all text-hint">{name}</span>
              </div>
            ))}
          </div>
        </Card>
      </Row>
    </main>
  );
}
