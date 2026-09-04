import { useState, useRef, useCallback, useEffect } from 'react';
import { pdfService } from '../services/pdf.service';

// Owns the full state machine for viewing a single PDF: idle -> loading ->
// ready | error. Never lets a consumer render a file before it's confirmed to
// exist — `localPath` is only ever set once pdfService has fully verified the
// download (see pdfDownload.service.js).
export function usePdfViewer() {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [localPath, setLocalPath] = useState(null);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const activeRef = useRef(null); // { cancel, documentId }
  const lastArgsRef = useRef(null); // { documentId } for retry()

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current?.cancel?.();
    };
  }, []);

  const open = useCallback((documentId) => {
    // Cancel any previous in-flight resolution (e.g. rapid taps on two
    // different documents) before starting a new one.
    activeRef.current?.cancel?.();

    lastArgsRef.current = { documentId };
    setError(null);
    setLocalPath(null);
    setStatus('loading');

    const { promise, cancel } = pdfService.resolveLocalPath(documentId);
    activeRef.current = { cancel, documentId };

    promise
      .then((path) => {
        if (!mountedRef.current || activeRef.current?.documentId !== documentId) return;
        setLocalPath(path);
        setStatus('ready');
      })
      .catch((err) => {
        if (!mountedRef.current || activeRef.current?.documentId !== documentId) return;
        if (err?.code === 'PDF_DOWNLOAD_CANCELLED') return; // intentional — no error UI
        setError(err);
        setStatus('error');
      });
  }, []);

  const retry = useCallback(() => {
    const args = lastArgsRef.current;
    if (args) open(args.documentId);
  }, [open]);

  const reset = useCallback(() => {
    activeRef.current?.cancel?.();
    activeRef.current = null;
    setStatus('idle');
    setLocalPath(null);
    setError(null);
  }, []);

  return { status, localPath, error, open, retry, reset };
}
