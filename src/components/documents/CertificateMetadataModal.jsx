"use client";

/* Certificate details — the app's CertificateMetadataModal.
 *
 * A file was just picked for a certificate/STCW document. These four fields are
 * what getVerifiedCertificates() (career-profile aggregation) reads: without
 * them a generated resume's Certificates section shows the raw category name
 * and blank issuer/expiry columns. So it fires BEFORE the upload, once per pick,
 * on every path — never after, never optionally.
 *
 * All four fields are optional. The app's own comment: "not every document has
 * known issue/expiry dates". But whatever IS typed has to be sensible — an issue
 * date cannot be in the future, and expiry cannot precede issue.
 *
 * Two things the app needs and the web does not:
 *   · Its parseDDMMYYYY + toIsoDate pair. DatePicker already emits YYYY-MM-DD,
 *     which is what the API wants, so there is nothing to convert and no
 *     "invalid date" case to catch — the picker cannot produce one.
 *   · Its SHEET_HEIGHT / SCREEN_HEIGHT pinning, which exists only to stop an
 *     Android keyboard resizing the modal window out from under the sheet.
 */

import { useState } from "react";
import { Button, DatePicker, Input, Modal } from "@/components/ui";
import { t } from "@/i18n";

const EMPTY = { name: "", issuingAuthority: "", issueDate: "", expiryDate: "" };

/* The API stores empty optionals as null, not "" — same rule the CV entry
   modal follows against careerProfile.model.js. */
const orNull = (v) => (v || "").trim() || null;

const today = () => new Date().toISOString().slice(0, 10);

/* Mounted only while a pick is waiting on it, so mounting IS the reset — the
   fields belong to one file, and a second certificate must not inherit the
   first one's issuer. The app clears them in an effect on `visible` because its
   sheet stays mounted to animate; a <dialog> has no exit animation to preserve,
   and an effect that calls setState on open is the cascading render React
   Compiler rejects. */
export function CertificateMetadataModal({ onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    /* DatePicker's `max`/`min` already block both of these while picking. This
       still runs because min is only a snapshot: pick an expiry, then go back
       and set an issue date after it, and nothing re-checks the pair. */
    if (form.expiryDate && form.issueDate && form.expiryDate < form.issueDate) {
      setError(t("documents.certMetadata.expiryBeforeIssue"));
      return;
    }
    setError(null);
    onSubmit({
      type: orNull(form.name),
      issuingAuthority: orNull(form.issuingAuthority),
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
    });
  };

  return (
    <Modal
      open
      onClose={submitting ? () => {} : onCancel}
      title={t("documents.certMetadata.title")}
      footer={
        <>
          <Button variant="text" tone="primary" disabled={submitting} onClick={onCancel}>
            {t("documents.modal.cancel")}
          </Button>
          <Button loading={submitting} onClick={handleSave} icon="upload">
            {t("documents.certMetadata.save")}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-hint">{t("documents.certMetadata.subtitle")}</p>

      <div className="flex flex-col gap-3">
        <Input
          label={t("documents.certMetadata.name")}
          placeholder={t("documents.certMetadata.namePlaceholder")}
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
        />
        <Input
          label={t("documents.certMetadata.issuingAuthority")}
          value={form.issuingAuthority}
          onChange={(e) => set("issuingAuthority")(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {/* A certificate is issued in the past and expires in the future, so
              neither picker needs the DOB-sized 80-year reach. */}
          <DatePicker
            label={t("documents.certMetadata.issueDate")}
            value={form.issueDate}
            onChange={set("issueDate")}
            max={today()}
            yearsBack={40}
            yearsForward={0}
          />
          <DatePicker
            label={t("documents.certMetadata.expiryDate")}
            value={form.expiryDate}
            onChange={set("expiryDate")}
            min={form.issueDate || undefined}
            error={error}
            yearsBack={40}
            yearsForward={20}
          />
        </div>
      </div>
    </Modal>
  );
}

export default CertificateMetadataModal;
