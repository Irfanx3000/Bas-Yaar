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
import { useResumeConfigurations } from "@/context/ResumeConfigurationsContext";
import { EntryModal } from "@/components/cv/EntryModal";
import { ResumePreviewModal } from "@/components/cv/ResumePreviewModal";
import { PersonalInfoModal } from "@/components/profile/PersonalInfoModal";
import { showAlert } from "@/utils/alertRef";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { t } from "@/i18n";
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

/* One row of "My Resumes" — the app's ResumeListItem. The button's job follows
   the resume's state: Generate (never made), View (made and current), Update
   (made, but the profile has changed since — the backend's isStale compares
   content hashes, so a CV never quietly shows a certificate that was removed). */
function ResumeRow({ resume, templateName, generating, onGenerate, onView, onDelete }) {
  const lastGeneratedAt = resume.metadata?.lastGeneratedAt;
  const hasGenerated = !!lastGeneratedAt && !!resume.metadata?.lastGeneratedDocumentId;
  const isStale = hasGenerated && !!resume.isStale;
  const needsRender = isStale || !hasGenerated;

  return (
    <li className="relative flex items-center gap-3 border-b border-line-soft py-3 last:border-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-round bg-primary-light text-primary">
        <Icon name="file-alt" size={16} />
      </span>
      <div className="min-w-0 flex-1">
        {/* The title link's hit area covers the row (after:inset-0), so the
            whole row opens the editor, as a tap does in the app. */}
        <Link
          href={`/cv/resume?id=${resume._id}`}
          className="block truncate text-md font-bold text-heading after:absolute after:inset-0 after:content-[''] hover:text-primary"
        >
          {resume.title}
        </Link>
        <p className="truncate text-sm text-body">{templateName || t("careerProfile.resumes.templateUnknown")}</p>
        <p className="text-xs text-hint">
          {lastGeneratedAt
            ? t("careerProfile.resumes.lastGenerated", { date: dateLabel(lastGeneratedAt) })
            : t("careerProfile.resumes.neverGenerated")}
        </p>
        {isStale ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-warning-text">
            <Icon name="exclamation-circle" size={10} />
            {t("careerProfile.resumes.outdated")}
          </p>
        ) : null}
      </div>
      {/* relative z-10 lifts the actions above the row-wide link. */}
      <div className="relative z-10 flex shrink-0 items-center gap-1">
        <Button size="sm" loading={needsRender && generating} onClick={needsRender ? onGenerate : onView}>
          {t(isStale ? "careerProfile.resumes.regenerate" : hasGenerated ? "careerProfile.resumes.view" : "careerProfile.resumes.generate")}
        </Button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("common.delete")}
          className="cursor-pointer rounded-round p-2 text-danger hover:bg-danger-light"
        >
          <Icon name="trash-alt" size={14} />
        </button>
      </div>
    </li>
  );
}

export default function CVPage() {
  const { profile: user, refresh: refreshProfile } = useProfile() ?? {};
  const { resumes, templates, generateResume, deleteResume } = useResumeConfigurations();
  const [generatingId, setGeneratingId] = useState(null);
  const [preview, setPreview] = useState(null); // { documentId, title }
  const [editingPersonal, setEditingPersonal] = useState(false);
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

  const templateNameById = (id) => templates.find((tpl) => tpl._id === id)?.name;

  /* Per-row, not the context's global isGenerating — otherwise every row's
     button would spin while one resume renders. */
  const handleGenerate = async (resume) => {
    setGeneratingId(resume._id);
    try {
      const doc = await generateResume(resume._id);
      setPreview({ documentId: doc._id, title: resume.title });
    } catch (err) {
      showAlert({
        type: "error",
        title: t("careerProfile.resumes.generateErrorTitle"),
        message: getErrorMessage(err, t) || t("careerProfile.resumes.generateErrorBody"),
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDeleteResume = (resume) =>
    showAlert({
      type: "warning",
      title: t("careerProfile.resumeEditor.deleteTitle"),
      message: t("careerProfile.resumeEditor.deleteMessage", { title: resume.title }),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteResume(resume._id);
            } catch (err) {
              showAlert({
                type: "error",
                title: t("careerProfile.editor.saveErrorTitle"),
                message: getErrorMessage(err, t) || t("careerProfile.editor.saveErrorBody"),
              });
            }
          },
        },
      ],
    });

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
          {/* Opens the same PersonalInfoModal Profile uses — this linked to
              /profile/personal, a route that never existed. */}
          <button
            type="button"
            onClick={() => setEditingPersonal(true)}
            aria-label="Edit details"
            className="shrink-0 cursor-pointer rounded-round p-1 text-hint hover:text-primary"
          >
            <Icon name="pencil-alt" size={14} />
          </button>
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
            <button
              type="button"
              onClick={() => setEditingPersonal(true)}
              className="mt-3 block w-full cursor-pointer border-t border-line-soft pt-3 text-center text-md font-semibold text-primary hover:underline"
            >
              Edit personal details
            </button>
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

      {/* My Resumes — the app's CareerProfileScreen section. The profile above
          is the content; these are the named, templated PDFs made from it. */}
      <Card radius="lg" className="mt-4">
        <div className="mb-1 flex items-center justify-between gap-3 border-b border-line-soft pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-round bg-primary-light text-primary">
              <Icon name="file-alt" size={14} />
            </span>
            <h2 className="truncate text-md font-bold text-heading">{t("careerProfile.resumes.title")}</h2>
          </div>
          {resumes.length ? (
            <Link
              href="/cv/resume"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
            >
              <Icon name="plus" size={11} />
              {t("careerProfile.resumes.new")}
            </Link>
          ) : null}
        </div>

        {resumes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-md text-hint">{t("careerProfile.resumes.empty")}</p>
            <Link href="/cv/resume">
              <Button icon="plus">{t("careerProfile.resumes.createFirst")}</Button>
            </Link>
          </div>
        ) : (
          <ul>
            {resumes.map((resume) => (
              <ResumeRow
                key={resume._id}
                resume={resume}
                templateName={templateNameById(resume.templateId)}
                generating={generatingId === resume._id}
                onGenerate={() => handleGenerate(resume)}
                onView={() =>
                  setPreview({ documentId: resume.metadata?.lastGeneratedDocumentId, title: resume.title })
                }
                onDelete={() => handleDeleteResume(resume)}
              />
            ))}
          </ul>
        )}
      </Card>

      <ResumePreviewModal
        documentId={preview?.documentId}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />

      {editingPersonal ? (
        <PersonalInfoModal
          onClose={() => setEditingPersonal(false)}
          onSaved={() => {
            refreshProfile?.();
            reload?.();
          }}
        />
      ) : null}

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
