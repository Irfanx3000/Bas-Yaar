"use client";

/* Personal Overview — Block E, route 1 of 7.
 *
 * Two sources, because the app screen shows two things that live apart, and
 * every field below was read from its contract before this file was written:
 *
 *   ProfileContext   { profile, completion, loading, refresh, refreshIfStale, setProfile }
 *     profile        { id, firstName, lastName, name, rank, email, phone,
 *                      location, avatarUrl, profileCompletion, maritimeProfile }
 *                    ← NO education, NO skills. Those are not on this payload.
 *
 *   CareerProfileContext  { profile, isLoading, error, load, reload,
 *                           updateCareerObjective, addEntry, updateEntry, removeEntry }
 *     profile        { id, careerObjective, experience, education, skills,
 *                      languages, references, customSections, personal, contact,
 *                      maritime, certificates, travelDocuments, completion, updatedAt }
 *
 *   education entry { institution, degree, fieldOfStudy, startDate, endDate,
 *                     location, description }   ← from the Mongoose schema; the
 *                     test account has none, so it could not be read from live data
 *
 * Note the two `profile` names collide, hence the aliases at the call site.
 *
 * Responsive: the app stacks four cards. Here identity + personal info form a
 * left column and education + preferences a right one from `lg`, because these
 * are reference cards rather than a sequence — nothing is read in order.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { PersonalInfoModal } from "@/components/profile/PersonalInfoModal";
import { useProfile } from "@/context/ProfileContext";
import { useCareerProfile } from "@/context/CareerProfileContext";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  LoadingState,
  ProgressBar,
  StatusBadge,
} from "@/components/ui";

/* Dates are year-only here — an education entry reads "2025 - 2028" in the app,
   and a full date adds nothing at a glance. Parsed from local parts so a stored
   UTC midnight cannot roll back a year. */
const year = (value) => (value ? new Date(value).getFullYear() : null);

const yearRange = (start, end) => {
  const from = year(start);
  const to = year(end);
  if (!from && !to) return null;
  if (from && to) return `${from} - ${to}`;
  return String(from ?? to);
};

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-round bg-primary-light text-primary">
        <Icon name={icon} size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-primary">{label}</p>
        <p className="mt-[2px] text-md break-words text-heading">{value || "—"}</p>
      </div>
    </div>
  );
}

function CardHeading({ icon, title, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 border-b border-line-soft pb-3">
      <div className="flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-round bg-primary-light text-primary">
          <Icon name={icon} size={14} />
        </span>
        <h2 className="text-md font-bold text-heading">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, completion, loading, refresh: refreshProfile } = useProfile() ?? {};
  const [editingPersonal, setEditingPersonal] = useState(false);
  const {
    profile: career,
    isLoading: careerLoading,
    load: loadCareer,
    reload: reloadCareer,
  } = useCareerProfile() ?? {};

  /* The context fetches at most once per session and exposes `load` rather than
     doing it on mount, so a screen that needs it has to ask. */
  useEffect(() => {
    loadCareer?.();
  }, [loadCareer]);

  if (loading && !profile) {
    return (
      <div className="mx-auto max-w-5xl px-[15px] py-6 lg:px-6">
        <LoadingState rows={3} />
      </div>
    );
  }

  const education = career?.education ?? [];
  const skills = career?.skills ?? [];
  const maritime = profile?.maritimeProfile ?? {};

  return (
    <div className="mx-auto max-w-5xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">Personal Overview</h1>
        <p className="mt-[2px] text-md text-body">Manage your profile details.</p>
      </header>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
        <div className="space-y-4">
          {/* Identity */}
          <Card radius="lg">
            <div className="flex items-start gap-4">
              <Avatar name={profile?.name} src={profile?.avatarUrl} size="xl" />

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-h3 font-extrabold text-heading">
                  {profile?.name || "Your name"}
                </h2>
                {profile?.rank ? (
                  <p className="mt-[2px] text-md font-semibold text-primary">{profile.rank}</p>
                ) : (
                  <p className="mt-[2px] text-md text-hint">No rank set</p>
                )}
                {profile?.id ? (
                  <p className="mt-[2px] text-sm text-hint">
                    ID: {String(profile.id).slice(-8).toUpperCase()}
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status="selected" label="Available" />
                  {maritime.department ? <Chip tone="neutral">{maritime.department}</Chip> : null}
                </div>
              </div>

              {/* Was a Link to /profile/personal, which does not exist — so
                  both Edit affordances navigated nowhere. The app has no such
                  route either: PersonalInformationScreen is mounted inside
                  PersonalInfoEditModal, taking onClose/onSaveSuccess. */}
              <button
                type="button"
                onClick={() => setEditingPersonal(true)}
                aria-label="Edit profile"
                className="shrink-0 cursor-pointer rounded-round p-2 text-hint hover:bg-primary-light hover:text-primary"
              >
                <Icon name="pencil-alt" size={14} />
              </button>
            </div>

            {completion?.percentage != null ? (
              <ProgressBar className="mt-4" value={completion.percentage} label="Profile strength" />
            ) : null}
          </Card>

          {/* Personal info */}
          <Card radius="lg">
            <CardHeading
              icon="user"
              title="Personal Info"
              action={
                <button
                  type="button"
                  onClick={() => setEditingPersonal(true)}
                  className="cursor-pointer text-sm font-semibold text-primary hover:underline"
                >
                  Edit
                </button>
              }
            />
            <div className="divide-y divide-line-soft">
              <Row icon="email" label="Email" value={profile?.email} />
              <Row icon="phone-alt" label="Phone" value={profile?.phone} />
              <Row icon="map-marker-alt" label="Location" value={profile?.location} />
            </div>
          </Card>
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
          {/* Education — lives on the career profile, not the user profile */}
          <Card radius="lg">
            <CardHeading
              icon="education"
              title="Education"
              action={
                <Link href="/cv/education" className="text-sm font-semibold text-primary hover:underline">
                  {education.length
                    ? `${education.length} Record${education.length === 1 ? "" : "s"}`
                    : "Add"}
                </Link>
              }
            />

            {careerLoading && !career ? (
              <LoadingState rows={1} />
            ) : education.length === 0 ? (
              <EmptyState
                icon="education"
                title="No education added"
                message="Add your qualifications so employers can verify them."
                action={
                  <Link href="/cv/education">
                    <Button size="sm">Add education</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-line-soft">
                {education.map((entry) => (
                  <li key={entry._id ?? entry.id ?? entry.institution} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-md font-bold text-heading">{entry.institution}</p>
                        {entry.location ? (
                          <p className="text-sm text-body">{entry.location}</p>
                        ) : null}
                        {yearRange(entry.startDate, entry.endDate) ? (
                          <p className="text-sm text-hint">
                            {yearRange(entry.startDate, entry.endDate)}
                          </p>
                        ) : null}
                      </div>
                      <div className="min-w-0 shrink-0 text-right">
                        {entry.degree ? (
                          <p className="text-md font-semibold text-heading">{entry.degree}</p>
                        ) : null}
                        {entry.fieldOfStudy ? (
                          <p className="text-sm text-body">{entry.fieldOfStudy}</p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Preferences */}
          <Card radius="lg">
            <CardHeading
              icon="cog"
              title="Preferences"
              action={
                <Link href="/preferences" className="text-sm font-semibold text-primary hover:underline">
                  Edit
                </Link>
              }
            />

            <p className="mb-2 text-sm font-medium text-body">Job type</p>
            <div className="flex flex-wrap gap-2">
              {maritime.department ? <Chip>{maritime.department}</Chip> : null}
              {maritime.rank ? <Chip tone="neutral">{maritime.rank}</Chip> : null}
              {maritime.designation ? <Chip tone="neutral">{maritime.designation}</Chip> : null}
              {!maritime.department && !maritime.rank && !maritime.designation ? (
                <p className="text-md text-hint">Nothing set yet.</p>
              ) : null}
            </div>

            <p className="mt-4 mb-2 text-sm font-medium text-body">Skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.length ? (
                skills.map((skill) => (
                  <Chip key={skill._id ?? skill.name} tone="neutral">
                    {skill.name}
                  </Chip>
                ))
              ) : (
                <Link href="/cv/skills" className="text-md font-semibold text-primary hover:underline">
                  Add your skills
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Mounted only while open, so opening it is the reset — the hook loads
          fresh values on mount and staged photo changes cannot survive a
          cancel. Both contexts are refreshed on save for the app's own reason:
          this screen reads the user profile while the CV reads the career
          profile, and a name change shows in both. */}
      {editingPersonal ? (
        <PersonalInfoModal
          onClose={() => setEditingPersonal(false)}
          onSaved={() => {
            refreshProfile?.();
            reloadCareer?.();
          }}
        />
      ) : null}
    </div>
  );
}
