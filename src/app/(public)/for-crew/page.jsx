import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";

export default function ForCrewPage() {
  const benefits = [
    {
      title: "Verified Cruise & Cargo Listings",
      desc: "Direct access to accredited employers and manning agencies without middlemen scams.",
      icon: "ship"
    },
    {
      title: "Centralized Maritime CV & Documents",
      desc: "Store STCW, CDC, CoC, and medical certificates in one place with expiry alerts.",
      icon: "folder-open"
    },
    {
      title: "Application Tracking",
      desc: "Real-time status updates from submission to contract signing.",
      icon: "chart-bar"
    }
  ];

  const steps = [
    { title: "Create Profile", icon: "user" },
    { title: "Upload STCW & Sea Time", icon: "upload" },
    { title: "Apply with 1 Click", icon: "paper-plane" },
    { title: "Track & Interview", icon: "check-circle" }
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
      <div className="w-full relative bg-white">
        <Navbar />
      </div>
      
      <main className="flex-1 pt-32 pb-20">
        {/* Hero */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto text-center mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-heading mb-6 tracking-tight">
            Chart Your Course to a <span className="text-primary block md:inline mt-2 md:mt-0">Better Maritime Career.</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto mb-10">
            CrewApply helps deck, engine, and hospitality crew land verified roles worldwide. Ditch the paperwork and take control of your career path.
          </p>
          <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-white rounded-full px-8 py-4 font-bold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform">
            Get Started Today
          </Link>
        </section>

        {/* Benefits Grid */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-line-soft text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Icon name={b.icon} size={28} />
                </div>
                <h3 className="text-xl font-bold text-heading mb-4">{b.title}</h3>
                <p className="text-body leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step-by-Step Flow */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24 bg-white p-8 md:p-16 rounded-[2rem] shadow-sm border border-line-soft">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-heading mb-4">How it works</h2>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center relative gap-8 md:gap-4">
             <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-50 -z-10 -translate-y-1/2"></div>
             {steps.map((s, i) => (
               <div key={i} className="flex flex-col items-center bg-white px-4">
                 <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-md mb-4 text-xl font-bold">
                   {i + 1}
                 </div>
                 <h4 className="font-bold text-heading text-center max-w-[150px] leading-tight">{s.title}</h4>
               </div>
             ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto">
          <div className="bg-primary/10 rounded-3xl p-10 md:p-16 text-center border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Ready to Join 10,000+ Seafarers Worldwide?</h2>
            <Link href="/signup" className="inline-block bg-primary text-white rounded-full px-8 py-3 font-bold hover:bg-primary-hover transition-colors shadow-sm hover:scale-105 transform">
              Join CrewApply Now
            </Link>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
