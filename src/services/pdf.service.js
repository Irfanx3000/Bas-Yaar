import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { pdfCacheService } from './pdfCache.service';
import { pdfDownloadService } from './pdfDownload.service';
import { documentsService } from './documents.service';

const cancelledError = () => {
  const err = new Error('Cancelled');
  err.code = 'PDF_DOWNLOAD_CANCELLED';
  return err;
};

const wrapTokenError = (err) => {
  err.code = err.code || 'PDF_TOKEN_ERROR';
  return err;
};

// Filesystem-safe filename from a free-text resume title.
const sanitizeFilename = (name) => (name || 'resume').replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'resume';

export const pdfService = {
  // Resolves a documentId to a local file path, using the cache when
  // possible and only downloading on a genuine miss. Returns { promise,
  // cancel } — the promise resolves with a local path (no "file://" prefix)
  // or rejects with a typed Error (err.code one of PDF_NETWORK_ERROR /
  // PDF_DOWNLOAD_FAILED / PDF_TOKEN_ERROR / PDF_DOWNLOAD_CANCELLED).
  resolveLocalPath(documentId) {
    let activeDownload = null;
    let cancelled = false;

    const promise = (async () => {
      // Cache-hit fast path — skip the network entirely.
      const cacheValid = await pdfCacheService.isValidCacheHit(documentId);
      if (cacheValid) return pdfCacheService.getCachePath(documentId);
      if (cancelled) throw cancelledError();

      // Cache miss — mint a fresh view token/URL (never cache the URL itself,
      // since its token expires in 5 minutes) and download.
      let url;
      try {
        url = await documentsService.getViewUrl(documentId);
      } catch (err) {
        throw wrapTokenError(err);
      }
      if (cancelled) throw cancelledError();

      activeDownload = pdfDownloadService.download(documentId, url);
      return await activeDownload.promise;
    })();

    return {
      promise,
      cancel: () => {
        cancelled = true;
        activeDownload?.cancel();
      },
    };
  },

  // Puts an already-cached PDF (see resolveLocalPath above) somewhere the
  // user can find it outside the app. There's no equivalent public
  // "Downloads" folder on iOS, so the two platforms genuinely need different
  // mechanics rather than one shared code path:
  //  - Android: copy into the public Download directory and register it with
  //    the system DownloadManager, so it shows up in the Downloads app and
  //    notification shade exactly like a browser download would.
  //  - iOS: hand the file to UIDocumentInteractionController's options menu
  //    (Share / Save to Files / Open in) — the standard way an iOS app lets
  //    a user take a file out of app-private storage.
  async saveToDevice(localPath, title) {
    const filename = `${sanitizeFilename(title)}.pdf`;

    if (Platform.OS === 'android') {
      const destPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${filename}`;
      if (await ReactNativeBlobUtil.fs.exists(destPath)) {
        await ReactNativeBlobUtil.fs.unlink(destPath);
      }
      await ReactNativeBlobUtil.fs.cp(localPath, destPath);
      await ReactNativeBlobUtil.android.addCompleteDownload({
        title: filename,
        description: filename,
        mime: 'application/pdf',
        path: destPath,
        showNotification: true,
      });
      return destPath;
    }

    await ReactNativeBlobUtil.ios.previewDocument(localPath);
    return localPath;
  },
};
