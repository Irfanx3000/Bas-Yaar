import ReactNativeBlobUtil from 'react-native-blob-util';
import { pdfCacheService } from './pdfCache.service';

const makePdfError = (code, message) => {
  const err = new Error(message || code);
  err.code = code; // consumed by getErrorMessage(err, t) via `errors.${code}` i18n keys
  return err;
};

const safeUnlink = async (path) => {
  try {
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      await ReactNativeBlobUtil.fs.unlink(path);
    }
  } catch {
    // best-effort cleanup only
  }
};

// Strips the "data:<mime>;base64," prefix FileReader.readAsDataURL adds.
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || '';
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read downloaded document'));
    reader.readAsDataURL(blob);
  });

export const pdfDownloadService = {
  // Downloads `url` to a temp file, verifies it (download completed, file
  // exists, size > 0), and only then commits it into the cache via
  // pdfCacheService. Never resolves with an unverified/partial file.
  // Returns { promise, cancel } so callers can abort mid-flight.
  //
  // The network fetch deliberately uses RN's built-in global `fetch` (the same
  // networking `<Image>`/axios already use reliably) rather than
  // react-native-blob-util's own `config().fetch()` — the latter's native
  // client fails intermittently in this app's dev environment (adb-reverse
  // over USB to localhost) even when the server responds 200 successfully.
  // react-native-blob-util is used only for the local disk write below
  // (fs.writeFile), a pure filesystem operation unaffected by that.
  download(documentId, url) {
    const controller = new AbortController();
    let cancelled = false;

    const promise = (async () => {
      await pdfCacheService.ensureDirExists();
      const tempPath = pdfCacheService.getTempPath(documentId);
      await safeUnlink(tempPath);

      let response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (err) {
        if (cancelled || err?.name === 'AbortError') {
          throw makePdfError('PDF_DOWNLOAD_CANCELLED', 'Download cancelled');
        }
        throw makePdfError('PDF_NETWORK_ERROR', err?.message);
      }

      if (cancelled) throw makePdfError('PDF_DOWNLOAD_CANCELLED', 'Download cancelled');

      if (!response.ok) {
        throw makePdfError('PDF_DOWNLOAD_FAILED', `Unexpected status ${response.status}`);
      }

      const blob = await response.blob();
      if (cancelled) throw makePdfError('PDF_DOWNLOAD_CANCELLED', 'Download cancelled');

      const base64Data = await blobToBase64(blob);
      if (cancelled) throw makePdfError('PDF_DOWNLOAD_CANCELLED', 'Download cancelled');

      await ReactNativeBlobUtil.fs.writeFile(tempPath, base64Data, 'base64');

      const fileExists = await ReactNativeBlobUtil.fs.exists(tempPath);
      if (!fileExists) {
        throw makePdfError('PDF_DOWNLOAD_FAILED', 'Downloaded file missing');
      }

      const stat = await ReactNativeBlobUtil.fs.stat(tempPath);
      if (!stat || !(Number(stat.size) > 0)) {
        await safeUnlink(tempPath);
        throw makePdfError('PDF_DOWNLOAD_FAILED', 'Downloaded file is empty');
      }

      // Only now — fully downloaded, verified to exist, verified non-empty —
      // does the file get moved into the real cache slot the rest of the app
      // can see. A component can never render a file before it exists.
      return pdfCacheService.commit(documentId, tempPath);
    })();

    return {
      promise,
      cancel: () => {
        cancelled = true;
        controller.abort();
      },
    };
  },
};
