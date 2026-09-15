"use client";

/* New / Edit Resume — the app's ResumeEditorScreen. "Create CV" lands here.
 *
 *   /cv/resume          create: title + template gallery + optional objective
 *   /cv/resume?id=…     edit:   the same, plus which profile entries go on it
 *
 * The flow is the app's, step for step:
 *  · Create saves the title/template/objective, and the backend pre-selects
 *    every experience/education/skill/language entry on the profile. The page
 *    then REPLACES itself with the edit URL (the app's navigation.replace), so
 *    Back does not return to an empty create form for a resume that now exists.
 *  · Save in edit mode updates the resume, generates the PDF, and opens the
 *    preview — the one action that produces a file.
 *  · Delete asks first, naming the resume.
 *
 * The app's greyed-out chevron/"more" header buttons are dropped: the shell's
 * navigation is always on screen, so a Back link to My CV does that job.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCareerProfile } from "@/context/CareerProfileContext";
import { useResumeConfigurations } from "@/context/ResumeConfigurationsContext";
import { resumeConfigurationService } from "@/services/resumeConfiguration.service";
import { TemplateCard } from "@/components/cv/TemplateCard";
import { ResumePreviewModal } from "@/components/cv/ResumePreviewModal";
import { showAlert } from "@/utils/alertRef";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { t } from "@/i18n";
import { Button, ErrorState, Icon, Input, LoadingState } from "@/components/ui";

// Same rule as the backend's textSanitizer.js — caught here before a round trip.
const NO_HTML_REGEX = /^[^<>]*$/;
const TITLE_MAX = 100;
const OBJECTIVE_MAX = 1000;

const toggleId = (ids, id) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]);

const validateTitle = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return t("careerProfile.editor.errors.required");
  if (!NO_HTML_REGEX.test(trimmed)) return t("careerProfile.editor.errors.noHtml");
  if (trimmed.length > TITLE_MAX) return t("careerProfile.editor.errors.tooLong", { max: TITLE_MAX });
  return null;
};

const validateObjective = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return null; // optional
  if (!NO_HTML_REGEX.test(trimmed)) return t("careerProfile.editor.errors.noHtml");
  if (trimmed.length > OBJECTIVE_MAX) return t("careerProfile.editor.errors.tooLong", { max: OBJECTIVE_MAX });
  return null;
};

/* useSearchParams opts the tree into client rendering, so Next requires a
   Suspense boundary above it. */
export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<Frame><LoadingState rows={3} /></Frame>}>
      <ResumeEditor />
    </Suspense>
  );
}

function Frame({ children }) {
  return <div className="mx-auto max-w-3xl px-[15px] pb-8 lg:px-6">{children}</div>;
}

function ResumeEditor() {
  const router = useRouter();
  const resumeId = useSearchParams().get("id");
  const isEditing = !!resumeId;

  const { profile } = useCareerProfile();
  const { templates, isLoading: templatesLoading, createResume, updateResume, deleteResume, generateResume, isGenerating } =
    useResumeConfigurations();

  const [resume, setResume] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState(null);
  const [objectiveOverride, setObjectiveOverride] = useState("");
  const [selection, setSelection] = useState({ experienceIds: [], educationIds: [], skillIds: [], languageIds: [] });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [previewDocumentId, setPreviewDocumentId] = useState(null);

  /* The resume being edited. setState only in the promise callbacks. */
  useEffect(() => {
    if (!resumeId) return;
    let ignore = false;
    resumeConfigurationService
      .getResumeById(resumeId)
      .then((r) => {
        if (ignore) return;
        setResume(r);
        setLoadError(null);
        setTitle(r.title);
        setTemplateId(r.templateId);
        setObjectiveOverride(r.objectiveOverride || "");
        setSelection({
          experienceIds: r.selection?.experienceIds || [],
          educationIds: r.selection?.educationIds || [],
          skillIds: r.selection?.skillIds || [],
          languageIds: r.selection?.languageIds || [],
        });
      })
      .catch((err) => {
        if (!ignore) setLoadError(getErrorMessage(err, t));
      });
    return () => {
      ignore = true;
    };
  }, [resumeId, loadAttempt]);

  const warnIncomplete = () =>
    showAlert({
      type: "warning",
      title: t("careerProfile.editor.requiredTitle"),
      message: t("careerProfile.resumeEditor.requiredBody"),
    });

  const validateForSave = () => {
    const titleError = validateTitle(title);
    const objectiveError = validateObjective(objectiveOverride);
    setErrors({ title: titleError, objectiveOverride: objectiveError });
    return !titleError && !objectiveError;
  };

  const saveFailed = (err) =>
    showAlert({
      type: "error",
      title: t("careerProfile.editor.saveErrorTitle"),
      message: getErrorMessage(err, t) || t("careerProfile.editor.saveErrorBody"),
    });

  const handleSaveNew = async () => {
    if (!validateForSave() || !templateId) return warnIncomplete();
    setIsSaving(true);
    try {
      const created = await createResume({
        title: title.trim(),
        templateId,
        objectiveOverride: objectiveOverride.trim() || undefined,
      });
      router.replace(`/cv/resume?id=${created._id}`);
    } catch (err) {
      saveFailed(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExisting = async () => {
    if (!validateForSave()) return warnIncomplete();
    setIsSaving(true);
    try {
      await updateResume(resumeId, {
        title: title.trim(),
        templateId,
        objectiveOverride: objectiveOverride.trim() || null,
        selection,
      });
      const doc = await generateResume(resumeId);
      setPreviewDocumentId(doc._id);
    } catch (err) {
      saveFailed(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () =>
    showAlert({
      type: "warning",
      title: t("careerProfile.resumeEditor.deleteTitle"),
      message: t("careerProfile.resumeEditor.deleteMessage", { title }),
      buttons: [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteResume(resumeId);
              router.push("/cv");
            } catch (err) {
              saveFailed(err);
            }
          },
        },
      ],
    });

  if (isEditing && loadError && !resume) {
    return (
      <Frame>
        <ErrorState
          message={loadError}
          onRetry={() => {
            setLoadError(null);
            setLoadAttempt((n) => n + 1);
          }}
        />
      </Frame>
    );
  }

  // A resume switched in via ?id= must not show the previous form's values.
  if (isEditing && resume?._id !== resumeId) {
    return (
      <Frame>
        <LoadingState rows={3} className="pt-6" />
      </Frame>
    );
  }

  return (
    <Frame>
      <header className="pt-2 pb-4">
        <Link
          href="/cv"
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Icon name="chevron-left" size={11} />
          My CV
        </Link>
        <h1 className="text-h2 font-extrabold text-heading">
          {t(isEditing ? "careerProfile.resumeEditor.editTitle" : "careerProfile.resumeEditor.createTitle")}
        </h1>
        {/* The copy carries a hard break sized for a phone header; not here. */}
        <p className="mt-[2px] text-md text-body">
          {t("careerProfile.resumeEditor.editorSubtitle").replace("\n", " ")}
        </p>
      </header>

      <Input
        label={t("careerProfile.resumeEditor.titleLabel")}
        required
        value={title}
        maxLength={TITLE_MAX}
        placeholder={t("careerProfile.resumeEditor.titlePlaceholder")}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => setErrors((prev) => ({ ...prev, title: validateTitle(title) }))}
        error={errors.title}
      />

      <p className="mt-4 mb-2 text-md font-semibold text-heading">
        {t("careerProfile.resumeEditor.template")}
        <span className="ml-[2px] text-danger" aria-hidden="true">*</span>
      </p>

      {/* A wall, not a carousel — the app's own reasoning: a gallery you have to
          swipe to discover is a gallery you cannot choose from. Columns come
          from the space available (≥145px cards), not a device breakpoint. */}
      {templatesLoading && templates.length === 0 ? (
        <LoadingState rows={2} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] gap-3" role="group" aria-label="Templates">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl._id}
              template={tpl}
              selected={tpl._id === templateId}
              onSelect={() => setTemplateId(tpl._id)}
            />
          ))}
        </div>
      )}

      <div className="mt-5">
        <label htmlFor="objective-override" className="mb-[5px] block text-sm font-medium text-body">
          {t("careerProfile.resumeEditor.objectiveOverride")}
        </label>
        <textarea
          id="objective-override"
          rows={4}
          value={objectiveOverride}
          maxLength={OBJECTIVE_MAX}
          placeholder={profile?.careerObjective || t("careerProfile.resumeEditor.objectivePlaceholder")}
          onChange={(e) => setObjectiveOverride(e.target.value)}
          onBlur={() =>
            setErrors((prev) => ({ ...prev, objectiveOverride: validateObjective(objectiveOverride) }))
          }
          aria-invalid={errors.objectiveOverride ? true : undefined}
          className={`w-full rounded-[12px] border bg-surface px-4 py-3 text-md text-heading outline-none placeholder:text-hint focus-visible:outline-none ${
            errors.objectiveOverride ? "border-danger" : "border-line-input focus:border-primary"
          }`}
        />
        {errors.objectiveOverride ? (
          <p role="alert" className="mt-[5px] text-sm text-danger">
            {errors.objectiveOverride}
          </p>
        ) : null}
      </div>

      {isEditing ? (
        <>
          <SelectionSection
            title={t("careerProfile.sections.experience")}
            entries={profile?.experience}
            selectedIds={selection.experienceIds}
            labelFor={(e) => [e.role, e.vesselName].filter(Boolean).join(" — ")}
            onToggle={(id) => setSelection((p) => ({ ...p, experienceIds: toggleId(p.experienceIds, id) }))}
          />
          <SelectionSection
            title={t("careerProfile.sections.education")}
            entries={profile?.education}
            selectedIds={selection.educationIds}
            labelFor={(e) => e.institution}
            onToggle={(id) => setSelection((p) => ({ ...p, educationIds: toggleId(p.educationIds, id) }))}
          />
          <SelectionSection
            title={t("careerProfile.sections.skills")}
            entries={profile?.skills}
            selectedIds={selection.skillIds}
            labelFor={(e) => e.name}
            onToggle={(id) => setSelection((p) => ({ ...p, skillIds: toggleId(p.skillIds, id) }))}
          />
          <SelectionSection
            title={t("careerProfile.sections.languages")}
            entries={profile?.languages}
            selectedIds={selection.languageIds}
            labelFor={(e) => e.name}
            onToggle={(id) => setSelection((p) => ({ ...p, languageIds: toggleId(p.languageIds, id) }))}
          />
        </>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        <Button
          fullWidth
          onClick={isEditing ? handleSaveExisting : handleSaveNew}
          loading={isSaving || isGenerating}
        >
          {t("common.save")}
        </Button>
        {isEditing ? (
          <button
            type="button"
            onClick={handleDelete}
            className="cursor-pointer py-3 text-md font-semibold text-danger hover:underline"
          >
            {t("careerProfile.resumeEditor.delete")}
          </button>
        ) : null}
      </div>

      <ResumePreviewModal
        documentId={previewDocumentId}
        title={title}
        onClose={() => setPreviewDocumentId(null)}
      />
    </Frame>
  );
}

function SelectionSection({ title, entries, selectedIds, labelFor, onToggle }) {
  if (!entries?.length) return null;
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-md font-semibold text-heading">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => {
          const selected = selectedIds.includes(entry._id);
          return (
            <button
              key={entry._id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(entry._id)}
              className={`cursor-pointer rounded-pill border px-4 py-1.5 text-sm transition-colors duration-[180ms] ease-standard ${
                selected
                  ? "border-primary bg-primary font-bold text-on-primary"
                  : "border-line bg-surface font-medium text-body hover:border-primary/50"
              }`}
            >
              {labelFor(entry)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
