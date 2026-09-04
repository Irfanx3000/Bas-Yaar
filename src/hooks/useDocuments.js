import { useState, useEffect, useCallback, useRef } from 'react';
import { documentsService } from '../services/documents.service';
import { DOC_FILTER } from '../constants/documents.constants';
import { usePullToRefresh } from './usePullToRefresh';

export function useDocuments() {
  const [items, setItems] = useState([]);
  const [matchingDocs, setMatchingDocs] = useState([]);
  const [counts, setCounts] = useState({});
  const [alertDocs, setAlertDocs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState(DOC_FILTER.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const fetchRef = useRef(0);

  // `silent` skips the isLoading flip — used for the background refresh after
  // an upload/delete, where the mutation already completed and re-showing a
  // full-screen spinner over an already-populated list just reads as an
  // unwanted "whole page refresh" for what's really a single-row update.
  const fetchDocuments = useCallback(async (filter, query, page, { silent = false } = {}) => {
    const id = ++fetchRef.current;
    if (!silent) setIsLoading(true);
    const result = await documentsService.getDocuments({ filter, query, page });
    if (id !== fetchRef.current) return; // stale request
    setItems(result.items);
    setMatchingDocs(result.matchingDocs);
    setCounts(result.counts);
    setAlertDocs(result.alertDocs);
    setTotalPages(result.totalPages);
    setCurrentPage(result.currentPage);
    if (!silent) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments(activeFilter, searchQuery, 1);
  }, [activeFilter, searchQuery, fetchDocuments]);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    fetchDocuments(activeFilter, searchQuery, page);
  }, [activeFilter, searchQuery, fetchDocuments]);

  // silent:true — pull-to-refresh shouldn't swap the whole list for a
  // full-screen spinner over an already-populated screen; resets to page 1
  // like every other list's pull-to-refresh in the app.
  const { refreshing, onRefresh: handleRefresh } = usePullToRefresh(
    useCallback(() => fetchDocuments(activeFilter, searchQuery, 1, { silent: true }), [activeFilter, searchQuery, fetchDocuments]),
  );

  const handleUpload = useCallback(async (categoryKey, asset, metadata) => {
    setUploading(true);
    setUploadError(null);
    try {
      await documentsService.uploadDocument(categoryKey, asset, metadata);
    } catch (err) {
      setUploadError(err);
      setUploading(false);
      throw err;
    }
    setUploading(false);
    // The upload itself already succeeded — a failure refreshing the list
    // afterward (e.g. a flaky connection right after a large upload) must
    // not be reported back as an upload failure; the next screen focus/pull
    // will pick up the latest state.
    fetchDocuments(activeFilter, searchQuery, currentPage, { silent: true }).catch(() => {});
    return true;
  }, [activeFilter, searchQuery, currentPage, fetchDocuments]);

  const handleView = useCallback((documentId) => documentsService.getViewUrl(documentId), []);

  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async (documentId) => {
    setDeleting(true);
    try {
      await documentsService.deleteDocument(documentId);
    } finally {
      setDeleting(false);
    }
    fetchDocuments(activeFilter, searchQuery, currentPage, { silent: true }).catch(() => {});
  }, [activeFilter, searchQuery, currentPage, fetchDocuments]);

  return {
    items,
    matchingDocs,
    counts,
    alertDocs,
    totalPages,
    currentPage,
    activeFilter,
    searchQuery,
    isLoading,
    uploading,
    uploadError,
    deleting,
    refreshing,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handleUpload,
    handleView,
    handleDelete,
    handleRefresh,
  };
}
