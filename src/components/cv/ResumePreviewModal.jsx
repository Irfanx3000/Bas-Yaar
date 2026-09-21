"use client";

import { useEffect, useState } from "react";
import { documentsService } from "@/services/documents.service";
import { framableUrl } from "@/lib/framableUrl";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { t } from "@/i18n";
import { Button, Icon, Modal } from "@/components/ui";

/* A generated resume PDF — the app's ResumePreviewModal.
 *
 * A resume is stored as an ordinary Document, so it is fetched exactly the way
 * Documents views a PDF: mint a view token, fetch the file, frame a blob: URL.
 * (Framing the API URL directly is what showed "api.crewapply.com refused to
 * connect" — see lib/framableUrl.js.)
 *
 * Loading is derived — "no result yet for this document/attempt" — so the
 * effect never sets state synchronously. Retry bumps `attempt`, which is part of
 * the key, so it refetches even for the same document. Each blob: URL is revoked
 * by the effect that created it, whether the modal closed or a newer one landed.
 *
 * Download is a plain <a download> on the blob: URL the preview already holds —
 * no second request, and the app's "save to device" becomes the browser's own.
 */
export function ResumePreviewModal({ documentId, title, onClose }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, url: null, error: null });
  const key = documentId ? `${documentId}:${attempt}` : null;

  useEffect(() => {
    if (!key) return;
    let ignore = false;
    let created = null;

    documentsService
      .getViewUrl(documentId)
      .then(framableUrl)
      .then((url) => {
        created = url;
        if (ignore) URL.revokeObjectURL(url);
        else setResult({ key, url, error: null });
      })
      .catch((err) => {
        if (!ignore) setResult({ key, url: null, error: getErrorMessage(err, t) });
      });

    return () => {
      ignore = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [key, documentId]);

  const current = result.key === key ? result : null;
  const filename = `${(title || "Resume").replace(/[\\/:*?"<>|]+/g, "").trim() || "Resume"}.pdf`;

  return (
    <Modal
      open={!!documentId}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        current?.url ? (
          /* An <a> drawn as the solid primary Button (same classes as Button.jsx),
             not a <Button> inside an <a> — interactive content may not nest. */
          <a
            href={current.url}
            download={filename}
            className="bg-gradient-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-md font-semibold text-on-primary shadow-sm transition-transform duration-[180ms] ease-standard select-none active:scale-[0.96]"
          >
            <Icon name="download" size={16} />
            {t("careerProfile.resumes.download")}
          </a>
        ) : null
      }
    >
      {!current ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-body">
          <Icon name="sync-alt" size={18} className="animate-spin text-primary" />
          <span className="text-md">{t("documents.modal.opening")}</span>
        </div>
      ) : current.error ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <Icon name="exclamation-circle" size={22} className="text-danger" />
          <p className="text-md text-heading">{t("careerProfile.resumes.previewError")}</p>
          <p className="max-w-prose text-sm text-body">{current.error}</p>
          <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
            {t("documents.modal.retry")}
          </Button>
        </div>
      ) : (
        <iframe src={current.url} title={title || "Resume"} className="h-[70vh] w-full rounded-md border-0" />
      )}
    </Modal>
  );
}
