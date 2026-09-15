"use client";

/* My CV — Block E, mirroring the app's CareerProfileScreen.
 *
 * The career profile is ONE resolved document, not a set of endpoints:
 *   { id, careerObjective, experience, education, skills, languages,
 *     references, customSections, personal, contact, maritime, certificates,
 *     travelDocuments, completion, updatedAt }
 *
 * Two kinds of section in there, and the difference decides what is editable:
 *   NATIVE      experience · education · skills · languages · references
 *               stored on the career profile, edited through addEntry /
 *               updateEntry / removeEntry
 *   AGGREGATED  personal · contact · maritime · certificates · travelDocuments
 *               assembled live from the user profile and the documents store.
 *               They are READ-ONLY here — editing Personal Details from this
 *               screen would write to the wrong place. Each links out to the
 *               screen that actually owns it.
 *
 * Adding an entry opens a dialog rather than pushing a route: the app pushes a
 * screen because a phone has nowhere else to put a form, while a dialog keeps
 * the CV visible behind it.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCareerProfile } from "@/context/CareerProfileContext";
import { useProfile } from "@/context/ProfileContext";
import { EntryModal } from "@/components/cv/EntryModal";
import {
  Avatar,
  Button,
  Card,
  ConfirmationModal,
  ErrorState,
  Icon,
  LoadingState,
  StatusBadge,
} from "@/components/ui";

const year = (v) => (v ? String(v).slice(0, 4) : null);
const range = (a, b, isCurrent) => {
  const from = year(a);
  const to = isCurrent ? "Present" : year(b);
  if (!from && !to) return null;
  return from && to ? `${from} - ${to}` : String(from ?? to);
};

const dateLabel = (v) =>
  v
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .format(new Date(`${String(v).slice(0, 10)}T00:00:00`))
    : null;

function SectionCard({ icon, title, meta, onAdd, addLabel, children }) {
  return (
    <Card radius="lg">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-line-soft pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-round bg-primary-light text-primary">
            <Icon name={icon} size={14} />
          </span>
          <h2 className="truncate text-md font-bold text-heading">{title}</h2>
        </div>
        {meta ? <span className="shrink-0 text-sm font-semibold text-primary">{meta}</span> : null}
      </div>

      {children}

      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 w-full cursor-pointer border-t border-line-soft pt-3 text-center text-md font-semibold text-primary hover:underline"
        >
          + {addLabel}
        </button>
      ) : null}
    </Card>
  );
}

/* One row per entry, with edit and delete. Delete goes through a confirmation
   because removeEntry is immediate and there is no undo on the server. */
function EntryRow({ children, onEdit, onDelete }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b border-line-soft py-3 last:border-0">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          className="cursor-pointer rounded-round p-2 text-hint hover:bg-primary-light hover:text-primary"
        >
          <Icon name="pencil-alt" size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="cursor-pointer rounded-round p-2 text-hint hover:bg-danger-light hover:text-danger"
        >
          <Icon name="trash-alt" size={12} />
        </button>
      </div>
    </li>
  );
}

export default function CVPage() {
  const { profile: user } = useProfile() ?? {};
  const {
    profile: cv,
    isLoading,
    error,
    load,
    reload,
    removeEntry,
  } = useCareerProfile() ?? {};

  const [editing, setEditing] = useState(null); // { section, entry }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load?.();
  }, [load]);

  if (isLoading && !cv) {
    return (
      <div className="mx-auto max-w-5xl px-[15px] py-6 lg:px-6">
        <LoadingState rows={4} />
      </div>
    );
  }

  if (error && !cv) {
    return (
      <div className="mx-auto max-w-5xl px-[15px] py-6 lg:px-6">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const personal = cv?.personal ?? {};
  const experience = cv?.experience ?? [];
  const education = cv?.education ?? [];
  const skills = cv?.skills ?? [];
  const languages = cv?.languages ?? [];
  const certificates = cv?.certificates ?? [];

  const openAdd = (section) => () => setEditing({ section, entry: null });
  const openEdit = (section, entry) => () => setEditing({ section, entry });

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeEntry(pendingDelete.section, pendingDelete.entry._id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  /* Total sea time, the app's "11.5 Years" figure. Summed from the entries
     themselves rather than stored, so it cannot drift from the records below. */
  const totalYears = experience.reduce((sum, e) => {
    if (!e.startDate) return sum;
    const from = new Date(e.startDate);
    const to = e.isCurrent || !e.endDate ? new Date() : new Date(e.endDate);
    const years = (to - from) / (365.25 * 24 * 3600 * 1000);
    return years > 0 ? sum + years : sum;
  }, 0);

  return (
    <div className="mx-auto max-w-5xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">My CV</h1>
        <p className="mt-[2px] text-md text-body">
          Manage and keep your details updated for faster applications.
        </p>
      </header>

      {/* Identity — read from the USER profile, not the career profile. */}
      <Card radius="lg">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={user?.name} src={user?.avatarUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-h3 font-extrabold text-heading">
              {user?.name || "Your name"}
            </h2>
            {user?.rank ? <p className="text-md text-body">{user.rank}</p> : null}
            <div className="mt-2 space-y-1 text-md text-heading">
              {user?.email ? (
                <p className="flex items-center gap-2">
                  <Icon name="email" size={12} className="shrink-0 text-primary" />
                  <span className="truncate">{user.email}</span>
                </p>
              ) : null}
              {user?.phone ? (
                <p className="flex items-center gap-2">
                  <Icon name="phone-alt" size={12} className="shrink-0 text-primary" />
                  {user.phone}
                </p>
              ) : null}
              {user?.location ? (
                <p className="flex items-center gap-2">
                  <Icon name="map-marker-alt" size={12} className="shrink-0 text-primary" />
                  {user.location}
                </p>
              ) : null}
            </div>
            <div className="mt-3">
              <StatusBadge status="selected" label="Available" />
            </div>
          </div>
          <Link href="/profile/personal" aria-label="Edit details" className="shrink-0">
            <Icon name="pencil-alt" size={14} className="text-hint hover:text-primary" />
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/cv/resume" className="flex-1">
            <Button fullWidth>Create CV</Button>
          </Link>
          <Link href="/documents" className="flex-1">
            <Button fullWidth variant="outline">
              Download CV
            </Button>
          </Link>
        </div>
      </Card>

      <div className="mt-4 space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
        <div className="space-y-4">
          {/* AGGREGATED — read-only here. Assembled from the user profile, so
              editing it from this screen would write to the wrong place. */}
          <SectionCard
            icon="user"
            title="Personal Details"
            meta={
              cv?.completion?.personal != null ? `${cv.completion.personal}% Complete` : undefined
            }
          >
            <dl className="grid grid-cols-2 gap-3 text-md sm:grid-cols-4">
              {[
                ["Full Name", personal.fullName ?? user?.name],
                ["Date of Birth", dateLabel(personal.dateOfBirth)],
                ["Nationality", personal.nationality],
                ["Gender", personal.gender],
                ["Passport Number", personal.passportNumber],
                ["Passport Expiry", dateLabel(personal.passportExpiry)],
                ["Place of Issue", personal.placeOfIssue],
                ["Marital Status", personal.maritalStatus],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-hint">{label}</dt>
                    <dd className="font-semibold break-words text-heading">{value}</dd>
                  </div>
                ))}
            </dl>
            <Link
              href="/profile/personal"
              className="mt-3 block border-t border-line-soft pt-3 text-center text-md font-semibold text-primary hover:underline"
            >
              Edit personal details
            </Link>
          </SectionCard>

          <SectionCard
            icon="briefcase"
            title="Sea Experience"
            meta={experience.length ? `${experience.length} Records` : undefined}
            onAdd={openAdd("experience")}
            addLabel="Add Experience"
          >
            {totalYears > 0 ? (
              <p className="mb-2 flex items-baseline justify-between text-md">
                <span className="text-body">Experience</span>
                <span className="font-bold text-heading">{totalYears.toFixed(1)} Years</span>
              </p>
            ) : null}
            {experience.length === 0 ? (
              <p className="text-md text-hint">No sea time added yet.</p>
            ) : (
              <ul>
                {experience.map((e) => (
                  <EntryRow
                    key={e._id}
                    onEdit={openEdit("experience", e)}
                    onDelete={() => setPendingDelete({ section: "experience", entry: e })}
                  >
                    <p className="text-md font-bold text-heading">{e.role}</p>
                    <p className="text-sm text-body">
                      {[e.vesselName, e.vesselType, e.company].filter(Boolean).join(" · ")}
                    </p>
                    {range(e.startDate, e.endDate, e.isCurrent) ? (
                      <p className="text-sm text-hint">{range(e.startDate, e.endDate, e.isCurrent)}</p>
                    ) : null}
                  </EntryRow>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            icon="education"
            title="Education"
            meta={education.length ? `${education.length} Records` : undefined}
            onAdd={openAdd("education")}
            addLabel="Add Education"
          >
            {education.length === 0 ? (
              <p className="text-md text-hint">No qualifications added yet.</p>
            ) : (
              <ul>
                {education.map((e) => (
                  <EntryRow
                    key={e._id}
                    onEdit={openEdit("education", e)}
                    onDelete={() => setPendingDelete({ section: "education", entry: e })}
                  >
                    <p className="text-md font-bold text-heading">{e.institution}</p>
                    <p className="text-sm text-body">
                      {[e.degree, e.fieldOfStudy, e.location].filter(Boolean).join(" · ")}
                    </p>
                    {range(e.startDate, e.endDate) ? (
                      <p className="text-sm text-hint">{range(e.startDate, e.endDate)}</p>
                    ) : null}
                  </EntryRow>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            icon="lightbulb"
            title="Skills"
            meta={skills.length ? `${skills.length} Added` : undefined}
            onAdd={openAdd("skills")}
            addLabel="Add Skills"
          >
            {skills.length === 0 ? (
              <p className="text-md text-hint">No skills added yet.</p>
            ) : (
              <ul>
                {skills.map((s) => (
                  <EntryRow
                    key={s._id}
                    onEdit={openEdit("skills", s)}
                    onDelete={() => setPendingDelete({ section: "skills", entry: s })}
                  >
                    <p className="text-md font-semibold text-heading">{s.name}</p>
                    {s.level || s.category ? (
                      <p className="text-sm text-body">
                        {[s.level, s.category].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </EntryRow>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            icon="link"
            title="Languages"
            meta={languages.length ? `${languages.length} Added` : undefined}
            onAdd={openAdd("languages")}
            addLabel="Add Language"
          >
            {languages.length === 0 ? (
              <p className="text-md text-hint">No languages added yet.</p>
            ) : (
              <ul>
                {languages.map((l) => (
                  <EntryRow
                    key={l._id}
                    onEdit={openEdit("languages", l)}
                    onDelete={() => setPendingDelete({ section: "languages", entry: l })}
                  >
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-md font-semibold text-heading">{l.name}</span>
                      <span className="text-sm text-hint">{l.proficiency}</span>
                    </p>
                  </EntryRow>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* AGGREGATED from the documents store — added in Documents, not here. */}
          <SectionCard
            icon="file-alt"
            title="Certifications"
            meta={certificates.length ? `${certificates.length} Added` : undefined}
          >
            {certificates.length === 0 ? (
              <p className="text-md text-hint">No certificates uploaded yet.</p>
            ) : (
              <ul>
                {certificates.map((c) => (
                  <li
                    key={c._id ?? c.id ?? c.name}
                    className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-md font-semibold text-heading">{c.name}</p>
                      {c.expiryDate ? (
                        <p className="text-sm text-hint">{dateLabel(c.expiryDate)}</p>
                      ) : null}
                    </div>
                    <Link
                      href="/documents"
                      className="shrink-0 text-sm font-semibold text-primary hover:underline"
                    >
                      View Document →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/documents"
              className="mt-3 block border-t border-line-soft pt-3 text-center text-md font-semibold text-primary hover:underline"
            >
              + Add Certificate
            </Link>
          </SectionCard>

          {cv?.careerObjective ? (
            <SectionCard icon="magic" title="Career Objective">
              <p className="max-w-prose text-md text-body">{cv.careerObjective}</p>
            </SectionCard>
          ) : null}
        </div>
      </div>

      {/* The key is what resets the form. Opening a different entry remounts
          EntryModal, so its lazy initial state is recomputed from that entry —
          no effect syncing props into state, and no stale values from whatever
          was edited last. */}
      <EntryModal
        key={`${editing?.section ?? "none"}-${editing?.entry?._id ?? "new"}`}
        open={!!editing}
        section={editing?.section}
        entry={editing?.entry}
        onClose={() => setEditing(null)}
      />

      <ConfirmationModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        destructive
        loading={deleting}
        title="Delete this entry?"
        message="It will be removed from your CV. This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
