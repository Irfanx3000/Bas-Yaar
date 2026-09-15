import Image from "next/image";
import { Navbar } from "@/components/landing/Navbar";
import { HeroContent } from "@/components/landing/HeroContent";
import { TrustIndicators } from "@/components/landing/TrustIndicators";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { DocumentsSection } from "@/components/landing/DocumentsSection";
import { GuidanceSection } from "@/components/landing/GuidanceSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FooterSection } from "@/components/landing/FooterSection";

export default function HomePage() {
  return (
    <>
      <main className="relative flex flex-col min-h-screen w-full overflow-hidden">
        <Image
          src="/landingpage-desktop-bg.jpeg"
          alt="Hero Background"
          fill
          priority
          className="object-cover object-center -z-10"
        />
        <Navbar />

        <section className="relative flex-1 flex flex-col justify-center w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-28 lg:pt-32">
          <div className="flex-1 flex flex-col justify-center lg:w-1/2 lg:pr-8">
            <HeroContent />
          </div>

          <TrustIndicators />
        </section>
      </main>

      <FeaturesSection />
      <DocumentsSection />
      <GuidanceSection />
      <TestimonialsSection />
      <FooterSection />
    </>
  );
import { redirect } from "next/navigation";

/* The site root.
 *
 * Until Phase 4 builds the real public landing page, `/` hands straight off to
 * the app rather than showing anything of its own. AuthGuard then does the
 * deciding it already does everywhere else: a signed-in visitor lands on their
 * dashboard, anyone else is sent to /login with ?next= so signing in returns
 * them here.
 *
 * What was here before was a Phase 1 placeholder — "the design tokens are
 * ported… nothing else is built yet" — whose only button opened /theme. Fine
 * while the domain was not live; it is the first thing a real visitor reads now.
 *
 * 307, not 308: this is temporary and should stop being a redirect the moment
 * there is a landing page. A permanent redirect is cached by browsers and by
 * Google, and undoing one is slow. `redirect()` defaults to 307 here.
 */
export default function RootPage() {
  redirect("/dashboard");
}
