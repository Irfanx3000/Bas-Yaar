"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCareerProfile } from "@/context/CareerProfileContext";
import { useJobTaxonomyOptions } from "@/hooks/useJobTaxonomyOptions";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { Button, DatePicker, InlineAlert, Input, Modal, Select } from "@/components/ui";

/* Add / edit a CV entry — the web form for what the app does in
 * CareerProfileEntryEditorScreen (432 LOC).
 *
 * ONE parameterised component for four sections, which is the app's own choice
 * and its own reasoning: "the container logic is identical per section; only the
 * fields genuinely differ, so this stays one parameterized screen rather than
 * five near-duplicate ones."
 *
 * A modal rather than a route is the shell decision the web gets to make: the
 * app pushes a screen because a phone has nowhere else to put a form, while a
 * dialog keeps the CV visible behind it so you can see what you are filling in
 * relative to what is already there.
 *
 * ── Every constraint below is copied, not invented ──────────────────────────
 * Field caps mirror careerProfile.model.js's maxlengths. `name` is shared by two
 * sections with DIFFERENT caps in the schema — skills 100, languages 50 — so it
 * cannot be one number.
 *
 * NO_HTML is the same rule as the backend's textSanitizer, applied here so a bad
 * paste is caught before a round trip rather than after one.
 *
 * Payloads are built per section exactly as buildPayload() does, including the
 * details that look incidental and are not:
 *   · empty optional strings become NULL, not "" — the schema defaults to null
 *   · `endDate` is null when isCurrent, whatever is in the field
 *   · responsibilities is a newline-split ARRAY, trimmed, blanks dropped
 *   · languages default to proficiency 'Conversational' when none is chosen
 */

const SKILL_LEVELS = ["Beginner", "Intermediate", "Expert"];
const LANGUAGE_PROFICIENCY = ["Basic", "Conversational", "Fluent", "Native"];

const NO_HTML = /^[^<>]*$/;

/* careerProfile.model.js maxlengths. */
const LIMIT = {
  role: 150, vesselName: 150, company: 150, location: 150,
  institution: 150, degree: 150, fieldOfStudy: 150, description: 1000,
  category: 50,
};
const NAME_LIMIT = { skills: 100, languages: 50 };

const REQUIRED_FIELD = {
  experience: "role",
  education: "institution",
  skills: "name",
  languages: "name",
};

const TEXT_FIELDS = {
  experience: ["role", "vesselName", "company", "location", "responsibilities"],
  education: ["institution", "degree", "fieldOfStudy", "location", "description"],
  skills: ["name", "category"],
  languages: ["name"],
};

const RESPONSIBILITY_MAX_LENGTH = 300;
const RESPONSIBILITY_MAX_COUNT = 15;

/* Option values are what the backend stores; only the shown label is translated. */
const optionsWithLabels = (values, prefix, t) =>
  values.map((value) => ({ value, label: t(`${prefix}.${value}`) }));

const TITLE_KEY = {
  experience: "web.profile.cv.seaExperience",
  education: "careerProfile.sections.education",
  skills: "careerProfile.skills.name",
  languages: "careerProfile.languages.name",
};

const EMPTY = {
  role: "", vesselName: "", vesselType: "", company: "",
  startDate: "", endDate: "", isCurrent: false, responsibilities: "",
  location: "", institution: "", degree: "", fieldOfStudy: "",
  description: "", name: "", level: "", category: "", proficiency: "",
};

/* The API stores dates as ISO; the picker speaks "YYYY-MM-DD". Sliced rather
   than passed through `new Date()`, which would shift the day across a
   timezone — the same trap DatePicker documents. */
const toPickerDate = (value) => (value ? String(value).slice(0, 10) : "");

export function EntryModal({ open, section, entry, onClose }) {
  const { t } = useTranslation();
  const { addEntry, updateEntry } = useCareerProfile() ?? {};
  const { vesselTypeOptions } = useJobTaxonomyOptions();

  /* Seeded ONCE, lazily. There is deliberately no effect syncing `entry` into
     state: the parent gives this component a `key` built from the section and
     entry id, so opening a different entry REMOUNTS it and this initialiser runs
     again. That is React's own answer to "reset state when a prop changes", and
     it avoids both the setState-inside-an-effect the compiler flags and the
     extra render it causes. */
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    ...entry,
    startDate: toPickerDate(entry?.startDate),
    endDate: toPickerDate(entry?.endDate),
    responsibilities: (entry?.responsibilities || []).join("\n"),
    isCurrent: entry?.isCurrent || false,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (!section) return null;

  const isEditing = !!entry?._id;
  const set = (key) => (value) =>
    setValues((prev) => ({ ...prev, [key]: value?.target ? value.target.value : value }));

  const limitFor = (key) => (key === "name" ? NAME_LIMIT[section] : LIMIT[key]);

  const validateField = (key, raw) => {
    const value = raw ?? "";

    if (key === "responsibilities") {
      const lines = value.split("\n").map((s) => s.trim()).filter(Boolean);
      if (lines.length > RESPONSIBILITY_MAX_COUNT)
        return t("careerProfile.editor.errors.tooManyLines", { max: RESPONSIBILITY_MAX_COUNT });
      if (lines.some((l) => l.length > RESPONSIBILITY_MAX_LENGTH))
        return t("web.profile.entry.lineTooLong", { max: RESPONSIBILITY_MAX_LENGTH });
      if (lines.some((l) => !NO_HTML.test(l))) return t("web.profile.entry.noAngleBrackets");
      return null;
    }

    if (key === REQUIRED_FIELD[section] && !value.trim()) return t("careerProfile.editor.errors.required");
    if (!NO_HTML.test(value)) return t("web.profile.entry.noAngleBrackets");

    const cap = limitFor(key);
    if (cap && value.length > cap) return t("careerProfile.editor.errors.tooLong", { max: cap });
    return null;
  };

  const buildPayload = () => {
    const trimmed = (k) => values[k].trim() || null;

    switch (section) {
      case "experience":
        return {
          role: values.role.trim(),
          vesselName: trimmed("vesselName"),
          vesselType: values.vesselType || null,
          company: trimmed("company"),
          startDate: values.startDate || null,
          // Null whenever this is the current posting, whatever the field holds.
          endDate: values.isCurrent ? null : values.endDate || null,
          isCurrent: values.isCurrent,
          responsibilities: values.responsibilities
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          location: trimmed("location"),
        };
      case "education":
        return {
          institution: values.institution.trim(),
          degree: trimmed("degree"),
          fieldOfStudy: trimmed("fieldOfStudy"),
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          location: trimmed("location"),
          description: trimmed("description"),
        };
      case "skills":
        return { name: values.name.trim(), level: values.level || null, category: trimmed("category") };
      case "languages":
        // Defaults to Conversational, as the app does.
        return { name: values.name.trim(), proficiency: values.proficiency || "Conversational" };
      default:
        return {};
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    for (const key of TEXT_FIELDS[section] ?? []) {
      const message = validateField(key, values[key]);
      if (message) nextErrors[key] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setSaveError(null);
    try {
      const payload = buildPayload();
      if (isEditing) await updateEntry(section, entry._id, payload);
      else await addEntry(section, payload);
      onClose?.();
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, extra = {}) => (
    <Input
      label={label}
      value={values[key]}
      onChange={set(key)}
      error={errors[key]}
      maxLength={limitFor(key)}
      required={key === REQUIRED_FIELD[section]}
      {...extra}
    />
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t(isEditing ? "web.profile.entry.editTitle" : "web.profile.entry.addTitle", {
        section: TITLE_KEY[section] ? t(TITLE_KEY[section]) : section,
      })}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="cv-entry-form" loading={saving}>
            {isEditing ? t("profile.personalInfo.save") : t("web.profile.common.add")}
          </Button>
        </>
      }
    >
      <form id="cv-entry-form" onSubmit={onSubmit}>
        {section === "experience" ? (
          <>
            {field("role", t("careerProfile.experience.role"))}
            <div className="grid gap-3 sm:grid-cols-2">
              {field("vesselName", t("careerProfile.experience.vesselName"))}
              <Select
                label={t("careerProfile.experience.vesselType")}
                placeholder={t("web.profile.common.select")}
                options={vesselTypeOptions}
                value={values.vesselType}
                onChange={set("vesselType")}
              />
            </div>
            {field("company", t("careerProfile.experience.company"))}
            {field("location", t("careerProfile.contact.location"))}
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker
                label={t("careerProfile.experience.startDate")}
                yearsBack={60}
                yearsForward={0}
                value={values.startDate}
                onChange={set("startDate")}
              />
              <DatePicker
                label={t("careerProfile.experience.endDate")}
                yearsBack={60}
                yearsForward={0}
                min={values.startDate || undefined}
                value={values.endDate}
                onChange={set("endDate")}
                disabled={values.isCurrent}
              />
            </div>
            <label className="mb-3 flex cursor-pointer items-center gap-2 text-md text-body">
              <input
                type="checkbox"
                checked={values.isCurrent}
                onChange={(e) => set("isCurrent")(e.target.checked)}
                className="size-4 accent-primary"
              />
              {t("careerProfile.experience.isCurrent")}
            </label>
            <TextArea
              label={t("careerProfile.experience.responsibilities")}
              hint={t("web.profile.entry.responsibilitiesHint", { max: RESPONSIBILITY_MAX_COUNT })}
              value={values.responsibilities}
              onChange={set("responsibilities")}
              error={errors.responsibilities}
              rows={4}
            />
          </>
        ) : null}

        {section === "education" ? (
          <>
            {field("institution", t("careerProfile.education.institution"))}
            <div className="grid gap-3 sm:grid-cols-2">
              {field("degree", t("careerProfile.education.degree"))}
              {field("fieldOfStudy", t("careerProfile.education.fieldOfStudy"))}
            </div>
            {field("location", t("careerProfile.contact.location"))}
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker
                label={t("careerProfile.experience.startDate")}
                yearsBack={60}
                yearsForward={10}
                value={values.startDate}
                onChange={set("startDate")}
              />
              <DatePicker
                label={t("careerProfile.experience.endDate")}
                yearsBack={60}
                yearsForward={10}
                min={values.startDate || undefined}
                value={values.endDate}
                onChange={set("endDate")}
              />
            </div>
            <TextArea
              label={t("careerProfile.education.description")}
              value={values.description}
              onChange={set("description")}
              error={errors.description}
              maxLength={LIMIT.description}
              rows={3}
            />
          </>
        ) : null}

        {section === "skills" ? (
          <>
            {field("name", t("careerProfile.skills.name"))}
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label={t("careerProfile.skills.level")}
                placeholder={t("web.profile.common.select")}
                options={optionsWithLabels(SKILL_LEVELS, "web.profile.entry.levels", t)}
                value={values.level}
                onChange={set("level")}
              />
              {field("category", t("careerProfile.skills.category"))}
            </div>
          </>
        ) : null}

        {section === "languages" ? (
          <>
            {field("name", t("careerProfile.languages.name"))}
            <Select
              label={t("careerProfile.languages.proficiency")}
              placeholder={t("web.profile.entry.proficiency.Conversational")}
              options={optionsWithLabels(LANGUAGE_PROFICIENCY, "web.profile.entry.proficiency", t)}
              value={values.proficiency}
              onChange={set("proficiency")}
            />
          </>
        ) : null}

        {saveError ? <InlineAlert tone="error">{saveError}</InlineAlert> : null}
      </form>
    </Modal>
  );
}

/* Multi-line input. Not in the kit because this is the first screen that needs
   one — it is added here rather than speculatively, and moves into
   components/ui the moment a second screen wants it. */
function TextArea({ label, value, onChange, error, hint, rows = 3, maxLength }) {
  return (
    <div className="mb-3">
      <label className="mb-[5px] block text-sm font-medium text-body">{label}</label>
      <textarea
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={onChange}
        className={`w-full rounded-[12px] border bg-surface px-4 py-3 text-md text-heading outline-none focus-visible:outline-none ${
          error ? "border-danger" : "border-line-input focus:border-primary"
        }`}
      />
      {error || hint ? (
        <p className={`mt-[5px] text-sm ${error ? "text-danger" : "text-hint"}`}>{error || hint}</p>
      ) : null}
    </div>
  );
}

export default EntryModal;
