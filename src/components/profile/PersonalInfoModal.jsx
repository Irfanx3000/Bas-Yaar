"use client";

/* Edit personal information — the app's PersonalInformationScreen.
 *
 * A MODAL, matching the app rather than diverging from it: the app's screen
 * takes `onClose` / `onSaveSuccess` and is mounted inside
 * PersonalInfoEditModal → AppBottomSheet. It was never a route there, and the
 * Edit buttons on /profile pointed at /profile/personal, which does not exist —
 * so they navigated nowhere. Same shell decision as the CV EntryModal, and the
 * same component is reused.
 *
 * ── Everything here is the mirrored hook's, not invented ────────────────────
 * `usePersonalInformation` owns the load, the field state, ALL validation and
 * the save. This file supplies inputs and reads `errors`. The rules it enforces,
 * worth knowing because the form must not fight them:
 *   · full name, DOB, gender, marital status, phone and location are REQUIRED
 *   · DOB is 18–100 years and cannot be in the future
 *   · phone is validated against that country's real digit-length range, from
 *     the locked dial code — not a generic "at least 8 digits"
 *   · alternate phone is optional but must still look like a number
 *
 * ── Three field shapes that would be easy to get wrong ──────────────────────
 * 1. `dob` is "DD-MM-YYYY" in BOTH directions — the service formats it that way
 *    on read and posts it verbatim as `dateOfBirth`. DatePicker speaks
 *    "YYYY-MM-DD", so it is converted at that boundary and nowhere else.
 * 2. `phone` holds only the LOCAL number. The dial code was split off at load
 *    (`splitPhone`) and is re-attached on save, so it is shown locked beside the
 *    field. Typing a leading + or a country code here would double it.
 * 3. Email and nationality are deliberately read-only — the app passes
 *    `editable={false}`, and the hook's own comment says they are not
 *    re-validated because there is nothing for the user to fix.
 *
 * ── Photo changes are STAGED ────────────────────────────────────────────────
 * Picking or removing a photo touches nothing on the server; `handleSave`
 * applies whichever is pending, first. So closing without saving leaves the
 * stored photo intact — and the preview must therefore be a local object URL,
 * revoked when it is replaced so the blob is not leaked.
 *
 * The app's LocationField adds GPS auto-detect and suggestions. This is a plain
 * text field: `currentLocation` is free text on the backend, and the browser's
 * geolocation prompt on a form the user opened to type their city is a worse
 * trade than typing it.
 */

import { useEffect, useRef, useState } from "react";
import { usePersonalInformation } from "@/hooks/usePersonalInformation";
import { PERSONAL_INFO_CONSTANTS } from "@/constants/personalInformation.constants";
import { getPhoneLengthRange } from "@/constants/phoneLength.constants";
import { showToast } from "@/utils/toastRef";
import { t } from "@/i18n";
import { Avatar, Button, DatePicker, Icon, Input, LoadingState, Modal, Select } from "@/components/ui";

/* "DD-MM-YYYY" ⇄ "YYYY-MM-DD". Split on the separator rather than parsing to a
   Date: `new Date("1990-05-02")` is UTC midnight, which lands on the previous
   day for anyone west of Greenwich — a date of birth silently off by one. */
const toPickerDate = (ddmmyyyy) => {
  const parts = String(ddmmyyyy || "").split("-");
  return parts.length === 3 && parts[2].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "";
};
const fromPickerDate = (iso) => {
  const parts = String(iso || "").split("-");
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : "";
};

const OPTIONS = {
  gender: PERSONAL_INFO_CONSTANTS.GENDER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
  maritalStatus: PERSONAL_INFO_CONSTANTS.MARITAL_STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  })),
};

const label = (key) => t(`profile.personalInfo.labels.${key}`);
const placeholder = (key) => t(`profile.personalInfo.placeholders.${key}`);

function SectionTitle({ children }) {
  return <p className="mt-5 mb-2 text-md font-bold text-heading first:mt-0">{children}</p>;
}

export function PersonalInfoModal({ onClose, onSaved }) {
  const photoInputRef = useRef(null);

  const { formValues, errors, isLoading, isSaving, setFieldValue, handleSave, handlePhotoUpload, handlePhotoDelete } =
    usePersonalInformation((updated) => {
      showToast({ message: "Profile updated", tone: "success", icon: "user" });
      onSaved?.(updated);
      onClose?.();
    });

  /* State, not a ref: it is rendered, so reading it during render has to be
     legal. The cleanup runs whenever it CHANGES as well as on unmount, which
     revokes the previous blob at exactly the right moment and means no manual
     revoke is needed at either call site. */
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoTouched, setPhotoTouched] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const stagePhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    /* The hook stages the value it will later upload AND uses that same value
       as the preview. In the app those are one string; here they cannot be —
       the server needs the File, the <img> needs a URL. So the File goes
       through the hook and the preview is tracked beside it. */
    setPreviewUrl(URL.createObjectURL(file));
    handlePhotoUpload(file);
    setPhotoTouched(true);
  };

  const removePhoto = () => {
    setPreviewUrl(null);
    handlePhotoDelete();
    setPhotoTouched(true);
  };

  /* formValues.photoUrl is a File once staged, a URL string when it came from
     the server, and null when removed. Only a string can go into <img src>. */
  const photoSrc = previewUrl ?? (typeof formValues.photoUrl === "string" ? formValues.photoUrl : null);

  const phoneMax = formValues.phoneIso ? getPhoneLengthRange(formValues.phoneIso).max : 15;

  return (
    <Modal
      open
      onClose={isSaving ? () => {} : onClose}
      title={t("profile.personalInfo.title")}
      size="lg"
      footer={
        <>
          <Button variant="text" disabled={isSaving} onClick={onClose}>
            {t("documents.modal.cancel")}
          </Button>
          <Button type="submit" form="personal-info-form" loading={isSaving} icon="check">
            {t("profile.personalInfo.save")}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <form
          id="personal-info-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <p className="-mt-1 mb-3 text-sm text-hint">{t("profile.personalInfo.subtitle")}</p>

          <SectionTitle>{t("profile.personalInfo.sections.photo")}</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar src={photoSrc} name={formValues.fullName} size="lg" />
            <Button variant="outline" size="sm" icon="camera" onClick={() => photoInputRef.current?.click()}>
              {photoSrc ? "Change" : "Upload"}
            </Button>
            {photoSrc ? (
              <Button variant="text" tone="danger" size="sm" icon="trash-alt" onClick={removePhoto}>
                Remove
              </Button>
            ) : null}
            {/* profileUpload's own filter — image only, 5 MB, converted to WebP
                server-side. */}
            <input
              ref={photoInputRef}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={stagePhoto}
            />
          </div>
          {photoTouched ? (
            <p className="mt-2 text-sm text-hint">
              <Icon name="info-circle" size={12} className="mr-1 inline align-[-1px]" />
              Applied when you save.
            </p>
          ) : null}

          <SectionTitle>{t("profile.personalInfo.sections.basic")}</SectionTitle>
          <div className="flex flex-col gap-3">
            <Input
              label={label("fullName")}
              placeholder={placeholder("fullName")}
              required
              value={formValues.fullName ?? ""}
              error={errors.fullName}
              onChange={(e) => setFieldValue("fullName", e.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker
                label={label("dob")}
                placeholder={placeholder("dob")}
                required
                value={toPickerDate(formValues.dob)}
                error={errors.dob}
                onChange={(iso) => setFieldValue("dob", fromPickerDate(iso))}
                /* 18–100 is the hook's own rule; the picker simply cannot
                   offer what it would reject. */
                yearsBack={PERSONAL_INFO_CONSTANTS.VALIDATION.MAX_AGE}
                yearsForward={0}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - PERSONAL_INFO_CONSTANTS.VALIDATION.MIN_AGE))
                  .toISOString()
                  .slice(0, 10)}
              />
              <Select
                label={label("gender")}
                placeholder={placeholder("gender")}
                required
                options={OPTIONS.gender}
                value={formValues.gender ?? ""}
                error={errors.gender}
                onChange={(value) => setFieldValue("gender", value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label={label("maritalStatus")}
                placeholder={placeholder("maritalStatus")}
                required
                options={OPTIONS.maritalStatus}
                value={formValues.maritalStatus ?? ""}
                error={errors.maritalStatus}
                onChange={(value) => setFieldValue("maritalStatus", value)}
              />
              {/* Read-only, as in the app. Nationality is set at registration and
                  changing it would invalidate document/eligibility checks. */}
              <Input
                label={label("nationality")}
                value={formValues.nationality ?? ""}
                readOnly
                disabled
                hint="Set at registration"
              />
            </div>
          </div>

          <SectionTitle>{t("profile.personalInfo.sections.contact")}</SectionTitle>
          <div className="flex flex-col gap-3">
            <Input
              label={label("email")}
              type="email"
              value={formValues.email ?? ""}
              readOnly
              disabled
              hint="Contact support to change your email"
            />

            <div>
              <div className="flex items-end gap-2">
                {/* The locked dial code, shown beside the field rather than
                    inside it — `phone` is the local number only. */}
                {formValues.phoneDialCode ? (
                  <span className="flex h-12 shrink-0 items-center gap-1.5 rounded-md border border-line-input bg-canvas-top px-3 text-md font-semibold text-primary">
                    {formValues.phoneFlag ? <span aria-hidden="true">{formValues.phoneFlag}</span> : null}+
                    {formValues.phoneDialCode}
                  </span>
                ) : null}
                <Input
                  containerClassName="flex-1"
                  label={label("phone")}
                  placeholder={placeholder("phone")}
                  required
                  inputMode="numeric"
                  value={formValues.phone ?? ""}
                  error={errors.phone}
                  /* Digits only, capped at that country's real maximum — the
                     app strips non-digits here for the same reason. */
                  onChange={(e) => setFieldValue("phone", e.target.value.replace(/\D/g, "").slice(0, phoneMax))}
                />
              </div>
            </div>

            <Input
              label={label("altPhone")}
              placeholder={placeholder("altPhone")}
              inputMode="tel"
              value={formValues.altPhone ?? ""}
              error={errors.altPhone}
              onChange={(e) => setFieldValue("altPhone", e.target.value)}
            />
          </div>

          <SectionTitle>{t("profile.personalInfo.sections.location")}</SectionTitle>
          <Input
            label={label("location")}
            placeholder={placeholder("location")}
            required
            icon="map-marker-alt"
            value={formValues.location ?? ""}
            error={errors.location}
            onChange={(e) => setFieldValue("location", e.target.value)}
          />
        </form>
      )}
    </Modal>
  );
}

export default PersonalInfoModal;
