import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { APP_CONFIG } from '../constants/app.constants';
import { documentTypesService } from './documentTypes.service';
import { DOC_STATUS, DOC_FILTER, DOCS_PER_PAGE } from '../constants/documents.constants';

const formatFileTypes = (docType) => {
  const maxLabel = `(${docType.maxSizeMB} MB Max)`;
  if (docType.acceptedFileTypes === 'pdf') return `PDF ${maxLabel}`;
  if (docType.acceptedFileTypes === 'image') return `JPG, PNG ${maxLabel}`;
  return `PDF, JPG, PNG ${maxLabel}`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Merges the admin-configured document types with the user's own uploaded
// documents into the item shape DocumentListItem/DocumentFilterTabs/
// DocumentAlertBanner already expect.
const buildDocumentList = async () => {
  const [documentTypes, groupedRes] = await Promise.all([
    documentTypesService.getActiveDocumentTypes(),
    apiClient.get(ENDPOINTS.USER.DOCUMENTS),
  ]);
  const grouped = groupedRes.data.data.documents || {};

  return documentTypes.map((docType) => {
    const existing = grouped[docType.key]?.[0] || null;
    // No admin-verification workflow exists yet, so status is a simple
    // uploaded/not-uploaded signal — "Pending" has no real backend signal today.
    const status = existing ? DOC_STATUS.UPLOADED : DOC_STATUS.NOT_UPLOADED;

    return {
      id: docType.key,
      name: docType.label,
      description: docType.description,
      fileTypes: formatFileTypes(docType),
      iconName: docType.icon,
      status,
      date: formatDate(existing?.createdAt),
      fileName: existing?.originalName || null,
      isAlert: status === DOC_STATUS.NOT_UPLOADED && docType.isRequirableForJob,
      documentId: existing?._id || null,
      mimeType: existing?.mimeType || null,
      docType,
    };
  });
};

const applyFilter = (docs, filter) => {
  switch (filter) {
    case DOC_FILTER.UPLOADED:
      return docs.filter((d) => d.status === DOC_STATUS.UPLOADED);
    case DOC_FILTER.PENDING:
      return docs.filter((d) => d.status === DOC_STATUS.PENDING);
    case DOC_FILTER.MISSING:
      return docs.filter((d) => d.status === DOC_STATUS.NOT_UPLOADED);
    default:
      return docs;
  }
};

export const documentsService = {
  async getDocuments({ filter = DOC_FILTER.ALL, query = '', page = 1 } = {}) {
    const all = await buildDocumentList();

    let docs = [...all];
    if (query.trim()) {
      const q = query.toLowerCase();
      docs = docs.filter((d) => d.name.toLowerCase().includes(q));
    }

    const filtered = applyFilter(docs, filter);
    const total = filtered.length;
    const totalPages = Math.ceil(total / DOCS_PER_PAGE) || 1;
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * DOCS_PER_PAGE;
    const items = filtered.slice(start, start + DOCS_PER_PAGE);

    const counts = {
      [DOC_FILTER.ALL]: docs.length,
      [DOC_FILTER.UPLOADED]: applyFilter(docs, DOC_FILTER.UPLOADED).length,
      [DOC_FILTER.PENDING]: applyFilter(docs, DOC_FILTER.PENDING).length,
      [DOC_FILTER.MISSING]: applyFilter(docs, DOC_FILTER.MISSING).length,
    };

    const alertDocs = all.filter((d) => d.isAlert);

    return { items, matchingDocs: filtered, total, totalPages, currentPage: safePage, counts, alertDocs };
  },

  async uploadDocument(categoryKey, asset, metadata = {}) {
    const formData = new FormData();
    formData.append('category', categoryKey);
    // ⚠️ THE ONE LINE IN THIS MIRROR THAT CANNOT MATCH THE APP.
    // React Native's FormData accepts { uri, name, type }; the browser's does
    // not — it stringifies a plain object to "[object Object]" and multer then
    // sees no file at all. On the web `asset` IS the File the user picked, so
    // asset.name / asset.type still read correctly everywhere else below.
    //
    // The explicit 'multipart/form-data' header below is left as-is on purpose:
    // axios 1.x unsets it for FormData in a browser so the boundary is added by
    // the browser itself. Setting it by hand WITHOUT a boundary is what breaks
    // multipart uploads, and axios is what prevents that here.
    formData.append('file', asset, asset.name);
    if (Object.keys(metadata).length) formData.append('metadata', JSON.stringify(metadata));

    const { data } = await apiClient.post(ENDPOINTS.USER.DOCUMENTS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // The global 15s timeout (apiClient) is sized for quick JSON calls, not
      // a multi-MB photo upload on a slow connection — a short timeout here
      // was firing "network error" on uploads that were still succeeding
      // server-side, hence the "retry immediately works" pattern.
      timeout: 60000,
    });
    return data.data.document;
  },

  // Documents are privacy-sensitive (passports, medical certs, etc.) — the
  // server no longer serves them as plain static files. This mints a
  // short-lived (5 min), single-document-scoped token so the URL alone can be
  // handed to Linking.openURL/<Image> (neither can attach a custom auth header).
  async getViewUrl(documentId) {
    const { data } = await apiClient.get(ENDPOINTS.USER.DOCUMENT_VIEW_TOKEN(documentId));
    const token = data.data.token;
    return `${APP_CONFIG.API_BASE_URL}${ENDPOINTS.USER.DOCUMENT_FILE(documentId)}?token=${token}`;
  },

  async deleteDocument(documentId) {
    await apiClient.delete(ENDPOINTS.USER.DOCUMENT_BY_ID(documentId));
  },
};
