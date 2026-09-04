import Link from "next/link";

/* Placeholder. The real landing page is Phase 4, alongside the rest of the
   public, indexable surface. This exists so the route group resolves and the
   theme work has somewhere to be checked from. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-prose flex-col justify-center px-[15px] py-8">
      <p className="text-sm font-semibold tracking-wide text-primary">
        Phase 1 · scaffold and theme
      </p>
      <h1 className="mt-2 text-h1 font-extrabold text-heading">CrewApply</h1>
      <p className="mt-3 text-lg text-body">
        The design tokens are ported from the mobile app. Nothing else is built yet.
      </p>
      <Link
        href="/theme"
        className="bg-gradient-primary press mt-5 inline-flex w-fit items-center rounded-pill px-6 py-3 text-md font-bold text-on-primary shadow-md"
      >
        Open the theme reference
      </Link>
    </main>
  );
}
