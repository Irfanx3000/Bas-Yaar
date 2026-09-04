/* Stub for react-native-blob-util.

   ponytail: filesystem stub, not an implementation. The three PDF services
   (pdf, pdfCache, pdfDownload) use this as a real filesystem — dirs, exists,
   mkdir, cp, unlink, stat, plus Android download-manager and iOS document
   preview. The browser needs none of it: it renders PDFs natively and downloads
   through the Content-Disposition header. Phase 5 replaces all three services
   with an <iframe> and an object URL, roughly 20 lines total, and deletes this.

   `fs.dirs` must return real strings because pdfCache.service.js builds
   CACHE_DIR at module load. Every method throws instead of silently resolving,
   so if something reaches a PDF path before Phase 5 it fails loudly and names
   the reason rather than returning an empty file. Nothing on the login or jobs
   path touches it. */

const notOnWeb = (name) => () => {
  throw new Error(
    `react-native-blob-util.${name}() has no web implementation. ` +
      `PDF handling is rebuilt on browser APIs in Phase 5.`,
  );
};

const ReactNativeBlobUtil = {
  fs: {
    dirs: { CacheDir: "/cache", DocumentDir: "/documents", DownloadDir: "/downloads" },
    exists: async () => false, // "not cached" is the honest answer, and it is safe
    mkdir: notOnWeb("fs.mkdir"),
    cp: notOnWeb("fs.cp"),
    unlink: notOnWeb("fs.unlink"),
    stat: notOnWeb("fs.stat"),
    ls: async () => [],
    readFile: notOnWeb("fs.readFile"),
    writeFile: notOnWeb("fs.writeFile"),
  },
  config: notOnWeb("config"),
  fetch: notOnWeb("fetch"),
  android: { addCompleteDownload: notOnWeb("android.addCompleteDownload") },
  ios: { previewDocument: notOnWeb("ios.previewDocument") },
};

export default ReactNativeBlobUtil;
