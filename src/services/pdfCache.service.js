import ReactNativeBlobUtil from 'react-native-blob-util';

const CACHE_DIR = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/pdf_documents`;

const pathFor = (documentId) => `${CACHE_DIR}/${documentId}.pdf`;
const tempPathFor = (documentId) => `${CACHE_DIR}/${documentId}.download.tmp`;

const ensureDir = async () => {
  const dirExists = await ReactNativeBlobUtil.fs.exists(CACHE_DIR);
  if (!dirExists) await ReactNativeBlobUtil.fs.mkdir(CACHE_DIR);
};

// A document's content never changes in place — re-uploading a document
// archives the old Mongo record and creates a new one with a new _id (see
// document.service.js's archivePrevious + create), so documentId alone is a
// permanently stable cache key. No version/etag field is needed.
export const pdfCacheService = {
  getCachePath(documentId) {
    return pathFor(documentId);
  },

  getTempPath(documentId) {
    return tempPathFor(documentId);
  },

  async ensureDirExists() {
    return ensureDir();
  },

  // Existence + non-zero size is the completeness/corruption gate. A stronger
  // magic-byte check isn't needed here: a cache entry is only ever written via
  // commit() below, which moves a file into place ONLY after DownloadService
  // has fully verified it — so a partial/interrupted download can never end
  // up at this path in the first place. The only way a 0-byte or missing file
  // shows up is if something external touched app storage, which this check
  // still catches.
  async isValidCacheHit(documentId) {
    const path = pathFor(documentId);
    const fileExists = await ReactNativeBlobUtil.fs.exists(path);
    if (!fileExists) return false;

    try {
      const stat = await ReactNativeBlobUtil.fs.stat(path);
      return !!stat && Number(stat.size) > 0;
    } catch {
      return false;
    }
  },

  async remove(documentId) {
    const path = pathFor(documentId);
    if (await ReactNativeBlobUtil.fs.exists(path)) {
      await ReactNativeBlobUtil.fs.unlink(path);
    }
  },

  // Atomically "commits" an already-verified temp file into the final cache
  // slot. Only ever called by DownloadService, only after full verification —
  // never call this with an unverified file.
  async commit(documentId, verifiedTempPath) {
    await ensureDir();
    const finalPath = pathFor(documentId);
    if (await ReactNativeBlobUtil.fs.exists(finalPath)) {
      await ReactNativeBlobUtil.fs.unlink(finalPath);
    }
    await ReactNativeBlobUtil.fs.mv(verifiedTempPath, finalPath);
    return finalPath;
  },
};
