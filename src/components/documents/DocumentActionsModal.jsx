"use client";

/* View / upload / replace / delete for one document — the app's
 * DocumentUploadModal, minus the parts that only exist because React Native has
 * no file input.
 *
 * ── What is mirrored exactly ─────────────────────────────────────────────────
 *  · Size is checked against THIS document type's maxSizeMB before anything is
 *    sent. multer's own ceiling is a flat 20 MB for every type, and the strict
 *    per-type check happens server-side only after the file has already been
 *    uploaded to temp — so skipping this would mean a 9 MB photo travelling the
 *    whole way up just to be rejected for a 2 MB limit.
 *  · Replacing an existing document asks first, naming the NEW file. A misclick
 *    in a file picker otherwise silently overwrites a passport with the wrong
 *    scan, and the old one is gone.
 *  · certificate/stcw collect their metadata BEFORE upload, once per pick.
 *  · Delete asks first, and the confirmation names the document.
 *
 * ── Where the web differs, and why ───────────────────────────────────────────
 *  · The app offers Take Photo / Choose from Gallery / Choose File because RN
 *    needs a different native module for each. The browser has ONE file input
 *    whose picker already offers the camera as a source on Android and iOS, so
 *    three rows collapse into one. `accept` carries the type's own rule.
 *  · Preview opens ON TOP of this sheet rather than replacing it. The app has to
 *    close first — its sheet and preview are both full-screen — which is why its
 *    code carefully captures documentId/mimeType/name before `document` goes
 *    null. Nothing here goes null, so nothing needs capturing.
 *  · PDFs render in an <iframe>. The app downloads, verifies and caches to local
 *    disk before mounting <Pdf> because react-native-pdf cannot take a network
 *    URL; a browser renders a PDF URL natively. That is the whole reason
 *    pdf.service/pdfCache/pdfDownload (265 LOC) are not ported.
 *  · The prop is `doc`, not `document`. `document` would shadow the global one
 *    inside this component.
 */

import { useRef, useState } from "react";
import { Icon, Modal } from "@/components/ui";
import { DOC_STATUS } from "@/constants/documents.constants";
import { getErrorMessage } from "@/i18n/getErrorMessage";
import { showAlert } from "@/utils/alertRef";
import { t } from "@/i18n";
import { CertificateMetadataModal } from "./CertificateMetadataModal";

const CERTIFICATE_TYPE_KEYS = ["certificate", "stcw"];

/* The type's own rule, in the form an <input accept> understands. */
const ACCEPT = {
  pdf: "application/pdf",
  image: "image/jpeg,image/png,image/webp",
  both: "application/pdf,image/jpeg,image/png,image/webp",
};

function ActionRow({ icon, label, tone = "primary", onClick }) {
  const color = tone === "danger" ? "text-danger" : "text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-3 text-left transition-colors duration-[180ms] ease-standard hover:bg-canvas-top"
    >
      <Icon name={icon} size={16} className={`shrink-0 ${color}`} />
      <span className={`text-md ${tone === "danger" ? "text-danger" : "text-heading"}`}>{label}</span>
    </button>
  );
}

export function DocumentActionsModal({ open, doc, onClose, onUpload, uploading, onView, onDelete, deleting }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null); // { url, isPdf, name }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pendingCert, setPendingCert] = useState(null); // { docTypeKey, file }
  const [submittingCert, setSubmittingCert] = useState(false);

  const docType = doc?.docType;
  const maxSizeMB = docType?.maxSizeMB;
  const isUploaded = doc?.status === DOC_STATUS.UPLOADED && !!doc?.documentId;
  const busy = uploading || deleting || previewLoading;

  const checkSize = (bytes) => {
    if (maxSizeMB && bytes && bytes > maxSizeMB * 1024 * 1024) {
      showAlert({
        type: "warning",
        title: t("documents.alerts.fileTooLargeTitle"),
        message: t("documents.alerts.fileTooLargeMessage", { maxSizeMB }),
      });
      return false;
    }
    return true;
  };

  /* `dismissible: false` so the buttons are the only way out. The app's native
     alert always resolves; a web dialog can be dismissed with Escape or a
     backdrop click, and that would leave this promise pending forever. */
  const confirmReplace = (fileName) =>
    new Promise((resolve) => {
      showAlert({
        type: "warning",
        dismissible: false,
        title: t("documents.alerts.confirmReplaceTitle"),
        message: t("documents.alerts.confirmReplaceMessage", { docName: doc.name, fileName }),
        buttons: [
          { text: t("documents.modal.cancel"), style: "cancel", onPress: () => resolve(false) },
          { text: t("documents.modal.replace"), style: "default", onPress: () => resolve(true) },
        ],
      });
    });

  const submit = async (file, metadata) => {
    if (!docType) return;

    if (isUploaded && !metadata) {
      const confirmed = await confirmReplace(file.name);
      if (!confirmed) return;
    }

    /* Deferred, not skipped — the metadata form has to fire exactly once per
       pick, so it runs here rather than at the picker. */
    if (!metadata && CERTIFICATE_TYPE_KEYS.includes(docType.key)) {
      setPendingCert({ docTypeKey: docType.key, file });
      return;
    }

    try {
      await onUpload(docType.key, file, metadata);
      onClose?.();
    } catch (err) {
      showAlert({
        type: "error",
        title: t("documents.alerts.uploadFailedTitle"),
        message: getErrorMessage(err, t),
      });
    }
  };

  const handleFileChosen = (event) => {
    const file = event.target.files?.[0];
    /* Reset first: picking the SAME file twice in a row fires no change event
       otherwise, so a failed upload could not be retried with the same file. */
    event.target.value = "";
    if (!file) return;
    if (!checkSize(file.size)) return;
    submit(file);
  };

  const submitCertificateMetadata = async (metadata) => {
    if (!pendingCert) return;
    setSubmittingCert(true);
    try {
      await onUpload(pendingCert.docTypeKey, pendingCert.file, metadata);
      setPendingCert(null);
      onClose?.();
    } catch (err) {
      showAlert({
        type: "error",
        title: t("documents.alerts.uploadFailedTitle"),
        message: getErrorMessage(err, t),
      });
    } finally {
      setSubmittingCert(false);
    }
  };

  const handleView = async () => {
    setPreviewLoading(true);
    try {
      /* A short-lived (5 min), single-document token in the query string.
         Documents are passports and medical certificates — the server stopped
         serving them as static files, and neither <img> nor <iframe> can send
         an Authorization header. */
      const url = await onView(doc.documentId);
      setPreview({ url, isPdf: doc.mimeType === "application/pdf", name: doc.name });
    } catch (err) {
      showAlert({
        type: "error",
        title: t("documents.alerts.couldNotOpenTitle"),
        message: getErrorMessage(err, t),
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmDelete = () => {
    const docId = doc?.documentId;
    const docName = doc?.name;
    if (!docId) return;

    showAlert({
      type: "warning",
      title: t("documents.alerts.deleteTitle"),
      message: t("documents.alerts.deleteMessage", { docName }),
      buttons: [
        { text: t("documents.modal.cancel"), style: "cancel" },
        {
          text: t("documents.modal.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete(docId);
              onClose?.();
            } catch (err) {
              showAlert({
                type: "error",
                title: t("documents.alerts.couldNotDeleteTitle"),
                message: getErrorMessage(err, t),
              });
            }
          },
        },
      ],
    });
  };

  return (
    <>
      <Modal open={open && !!doc} onClose={busy ? () => {} : onClose} title={doc?.name}>
        {maxSizeMB ? (
          <p className="-mt-1 mb-2 text-xs text-hint">{t("documents.modal.maxSize", { maxSizeMB })}</p>
        ) : null}

        {busy ? (
          <div className="flex items-center gap-3 py-6">
            <Icon name="sync-alt" size={16} className="animate-spin text-primary" />
            <span className="text-md text-body">
              {uploading
                ? t("documents.modal.uploading")
                : deleting
                  ? t("documents.modal.deleting")
                  : t("documents.modal.opening")}
            </span>
          </div>
        ) : (
          <div className="flex flex-col">
            {isUploaded ? (
              <ActionRow icon="eye" label={t("documents.modal.view")} onClick={handleView} />
            ) : null}

            <ActionRow
              icon="upload"
              label={isUploaded ? t("documents.modal.replaceFile") : t("documents.modal.chooseFile")}
              onClick={() => inputRef.current?.click()}
            />

            {isUploaded ? (
              <ActionRow
                icon="trash-alt"
                tone="danger"
                label={t("documents.modal.delete")}
                onClick={confirmDelete}
              />
            ) : null}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPT[docType?.acceptedFileTypes] ?? ACCEPT.both}
          onChange={handleFileChosen}
        />
      </Modal>

      {/* Sits above the sheet rather than replacing it, so closing the preview
          returns to the actions rather than to the list. */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name} size="lg">
        {preview?.isPdf ? (
          <iframe src={preview.url} title={preview.name} className="h-[70vh] w-full rounded-md border-0" />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt={preview.name}
            /* Not next/image: the URL carries a single-use view token and
               expires in 5 minutes, so there is nothing worth optimising or
               caching at the edge — and the optimizer would need the host
               allow-listed for a URL that is dead by the time it is fetched. */
            className="mx-auto max-h-[70vh] w-auto rounded-md"
          />
        ) : null}
      </Modal>

      {pendingCert ? (
        <CertificateMetadataModal
          submitting={submittingCert}
          onCancel={() => setPendingCert(null)}
          onSubmit={submitCertificateMetadata}
        />
      ) : null}
    </>
  );
}

export default DocumentActionsModal;
