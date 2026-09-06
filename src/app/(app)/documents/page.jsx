"use client";

/* My Documents — the app's DocumentsScreen.
 *
 * Composition is the app's, in its order: header, search, the missing-documents
 * banner, filter tabs with counts, the list, pagination.
 *
 * Contracts read before writing, per the standing rule:
 *   useDocuments → { items, matchingDocs, counts, alertDocs, totalPages,
 *                    currentPage, activeFilter, searchQuery, isLoading,
 *                    uploading, deleting, handleFilterChange, handleSearch,
 *                    handlePageChange, handleUpload, handleView, handleDelete }
 *     note handlePageChange here, NOT setCurrentPage — useApplicationsData uses
 *     the other name for the same idea.
 *   item → { id, name, description, fileTypes, iconName, status, date,
 *            fileName, isAlert, documentId, mimeType, docType }
 *     `id` is the document TYPE key (passport, stcw…), always present.
 *     `documentId` is the uploaded file's _id and is null until something is
 *     uploaded — the two are not interchangeable.
 *
 * STATUS IS NOT A THREE-STATE YET. documents.service.js derives it as
 * `existing ? Uploaded : Not Uploaded` with its own comment: there is no
 * admin-verification workflow, so nothing can ever be Pending. The Pending tab
 * is rendered anyway, at 0, because it is in the app and in the design — not
 * because it is dead code someone forgot.
 *
 * SEARCH REFETCHES PER KEYSTROKE. `handleSearch` sets the query, the hook's
 * effect refires, and getDocuments() calls the network again — even though the
 * filtering itself is client-side. That is the app's behaviour and it is left
 * alone deliberately; the document types are cached in their service and the
 * hook drops stale responses by request id, so the cost is chatter, not
 * correctness. Debounce here if it ever shows up in a network trace.
 */

import { useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { DOC_FILTER, DOC_STATUS } from "@/constants/documents.constants";
import { DocumentActionsModal } from "@/components/documents/DocumentActionsModal";
import { t } from "@/i18n";
import { Card, EmptyState, Icon, Input, LoadingState, Pagination, Tabs } from "@/components/ui";

const TABS = [
  { value: DOC_FILTER.ALL, labelKey: "documents.filters.all" },
  { value: DOC_FILTER.UPLOADED, labelKey: "documents.filters.uploaded" },
  { value: DOC_FILTER.PENDING, labelKey: "documents.filters.pending" },
  { value: DOC_FILTER.MISSING, labelKey: "documents.filters.missing" },
];

/* Colour carries the meaning here, the same way the application statuses do —
   the label alone is the fallback for anyone who cannot see it. */
const STATUS = {
  [DOC_STATUS.UPLOADED]: { labelKey: "documents.status.uploaded", color: "text-success", icon: "check-circle" },
  [DOC_STATUS.PENDING]: { labelKey: "documents.status.pending", color: "text-info", icon: "ellipsis-h" },
  [DOC_STATUS.NOT_UPLOADED]: { labelKey: "documents.status.notUploaded", color: "text-danger", icon: "times-circle" },
};

function DocumentRow({ doc, onSelect }) {
  const status = STATUS[doc.status] ?? STATUS[DOC_STATUS.NOT_UPLOADED];

  return (
    <Card padding="sm" radius="md" className="relative mb-2.5">
      {/* Four things compete for one line: icon, three lines of text, the status
          block and a chevron. Below `sm` that leaves the name about 90px, so the
          status moves to its own row instead of squeezing everything. The icon
          spans both rows so the text still starts at the same left edge. */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 sm:flex">
        <span className="row-span-2 flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary sm:row-span-1">
          <Icon name={doc.iconName} size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-md font-bold text-heading">{doc.name}</p>
          <p className="truncate text-sm text-hint">{doc.description}</p>
          {/* Once something is uploaded the accepted-types hint has done its
              job, so the row shows the actual file name instead. */}
          <p className="truncate text-xs text-hint">
            {doc.status === DOC_STATUS.UPLOADED && doc.fileName ? doc.fileName : doc.fileTypes}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-[3px]">
            <span className={`flex items-center gap-1.5 text-sm font-semibold ${status.color}`}>
              {t(status.labelKey)}
              <Icon name={status.icon} size={13} />
            </span>
            <span className="text-xs text-hint">{doc.date}</span>
          </div>
          <Icon name="chevron-right" size={12} className="shrink-0 text-hint" />
        </div>
      </div>

      {/* Stretched link over the whole card — the row is one target, and a
          nested button would be the only thing clickable otherwise. */}
      <button
        type="button"
        onClick={() => onSelect(doc)}
        aria-label={`${doc.name} — ${t(status.labelKey)}`}
        className="absolute inset-0 cursor-pointer rounded-md"
      />
    </Card>
  );
}

function MissingBanner({ docs }) {
  if (!docs?.length) return null;

  const single = docs.length === 1;

  return (
    <div className="mb-3.5 flex items-center gap-3.5 rounded-lg border border-danger/25 bg-danger/8 p-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-danger text-white">
        <Icon name="briefcase" size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-md font-bold text-danger">
          {single ? docs[0].name : t("documents.alertBanner.multiTitle", { count: docs.length })}
        </p>
        <p className="text-sm font-semibold text-heading">
          {single
            ? t("documents.alertBanner.body", { name: docs[0].name })
            : t("documents.alertBanner.multiBody", { names: docs.map((d) => d.name).join(", ") })}
        </p>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const {
    items,
    counts,
    alertDocs,
    totalPages,
    currentPage,
    activeFilter,
    searchQuery,
    isLoading,
    uploading,
    deleting,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handleUpload,
    handleView,
    handleDelete,
  } = useDocuments();

  const [selected, setSelected] = useState(null);

  /* The sheet is driven by the FRESH row for this document type, not the object
     captured at click time. Without this, uploading leaves the sheet still
     offering "Choose File" with no View or Delete, because `selected` is the
     row as it looked before the upload. */
  const selectedDoc = selected ? (items.find((d) => d.id === selected.id) ?? selected) : null;

  return (
    <div className="mx-auto max-w-4xl px-[15px] pb-8 lg:px-6">
      <header className="pt-2 pb-4">
        <h1 className="text-h2 font-extrabold text-heading">{t("documents.header.title")}</h1>
        <p className="mt-[2px] text-md whitespace-pre-line text-body">{t("documents.header.subtitle")}</p>
      </header>

      <Input
        icon="search"
        type="search"
        aria-label={t("documents.search.placeholder")}
        placeholder={t("documents.search.placeholder")}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        containerClassName="mb-3.5"
      />

      <MissingBanner docs={alertDocs} />

      <Tabs
        value={activeFilter}
        onChange={handleFilterChange}
        tabs={TABS.map((tab) => ({ value: tab.value, label: t(tab.labelKey), count: counts?.[tab.value] }))}
        className="mb-3.5"
      />

      {isLoading ? (
        <LoadingState rows={5} />
      ) : items.length === 0 ? (
        <EmptyState icon="folder-open" title={t("documents.empty")} />
      ) : (
        items.map((doc) => <DocumentRow key={doc.id} doc={doc} onSelect={setSelected} />)
      )}

      {!isLoading && totalPages > 1 ? (
        <Pagination page={currentPage} totalPages={totalPages} onChange={handlePageChange} className="mt-4" />
      ) : null}

      <DocumentActionsModal
        open={!!selectedDoc}
        doc={selectedDoc}
        onClose={() => setSelected(null)}
        onUpload={handleUpload}
        uploading={uploading}
        onView={handleView}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
