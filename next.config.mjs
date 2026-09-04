/** @type {import('next').NextConfig} */

/* Native modules → their web stand-ins in src/platform/.

   This is what lets ~7,200 lines of the mobile app's data layer live here as an
   unmodified copy: the copied files still `import ... from 'react-native'`, and
   the bundler answers with our shim. Re-copying a service from the app later is
   a file copy, not a porting exercise.

   Every entry here has a matching file in src/platform/ explaining what it
   stands in for and what, if anything, is deliberately not implemented. */
const nativeModuleAliases = {
  "react-native": "./src/platform/react-native.js",
  "react-i18next": "./src/platform/react-i18next.js",
  "@react-navigation/native": "./src/platform/navigation.js",
  "@react-native-async-storage/async-storage": "./src/platform/async-storage.js",
  "@react-native-community/geolocation": "./src/platform/geolocation.js",
  "@react-native-firebase/messaging": "./src/platform/messaging.js",
  "@notifee/react-native": "./src/platform/notifee.js",
  "react-native-blob-util": "./src/platform/blob-util.js",
  "react-native-razorpay": "./src/platform/razorpay.js",
};

const nextConfig = {
  reactCompiler: true,

  turbopack: {
    resolveAlias: nativeModuleAliases,
  },

  images: {
    /* Uploaded avatars, company logos, banners and category icons are served by
       the API host, not from /public. The backend already sets
       Cross-Origin-Resource-Policy: cross-origin on those routes (verified in
       Phase 0), so next/image can optimise them. */
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "api.crewapply.com", pathname: "/uploads/**" },
    ],

    /* Next 16 refuses to optimise an image whose hostname resolves to a private
       IP — an SSRF guard, since the optimiser fetches URLs on the server. In dev
       the API is on localhost (127.0.0.1), so every uploaded logo failed with
       `"url" parameter is not allowed` and rendered as broken alt text.
       Scoped to development ONLY: production points at api.crewapply.com, which
       is public, so the guard stays on where it actually matters. */
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
