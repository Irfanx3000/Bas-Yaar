import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  /* ── The mirrored data layer ──────────────────────────────────────────────
     These directories are a VERBATIM copy of CrewApply/src (see Phase 2 in
     PROGRESS.md). Their whole value is being an unedited mirror: when a service
     or hook is fixed in the app, re-copying the file is all that is needed.
     Editing them here to satisfy a linter would spend that property permanently,
     and would have to be redone on every future copy.

     React Compiler's new rules flag long-standing React Native patterns in them
     — a ref written during render in useSyncedResource, setState inside mount
     effects across most hooks, mutated locals in useHomeData, and a manual
     useCallback the compiler cannot verify in NotificationContext. Those
     patterns work and are not what this build is here to change.

     So those four rules are turned OFF for the mirror only. Everything written for
     the web still has them enforced, which is what caught the three real issues
     in AppShell, TopSearch and the job details page.

     If a rule ever fires on something that is genuinely broken here, fix it in
     the mobile app and re-copy — do not patch the mirror. */
  {
    files: [
      "src/api/**",
      "src/services/**",
      "src/hooks/**",
      "src/context/**",
      "src/store/**",
      "src/utils/**",
      "src/constants/**",
      "src/i18n/getErrorMessage.js",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
