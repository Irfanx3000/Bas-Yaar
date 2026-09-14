import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";

export default function HowItWorksPage() {
  const steps = [
    {
      title: "Build Your Maritime Profile",
      desc: "Input your rank, sea service time, and STCW certifications in one centralized digital profile.",
      icon: "user",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Discover Tailored Vacancies",
      desc: "Filter by vessel type (cruise, tanker, offshore, container) to find the perfect contract.",
      icon: "search",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Apply & Stand Out",
      desc: "Submit applications instantly with tailored maritime resumes and verified document attachments.",
      icon: "paper-plane",
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Direct Interview & Onboarding",
      desc: "Access interview preparation guides, breeze through agency screening, and receive travel details.",
      icon: "check-circle",
      color: "bg-orange-50 text-orange-600"
    }
  ];

  const faqs = [
    {
      q: "What are the costs for seafarers?",
      a: "Creating a profile, uploading documents, and applying for jobs is completely without cost for all seafarers. We do not charge crew members any placement fees."
    },
    {
      q: "How are my documents kept secure?",
      a: "Your STCW, CDC, and medical documents are encrypted and stored securely. Only verified employers you apply to can view your confidential documents."
    },
    {
      q: "Are the job listings verified?",
      a: "Absolutely. We strictly vet all manning agencies and employers on our platform to ensure they comply with MLC 2006 standards. No middlemen scams."
    }
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col font-sans">
      <div className="w-full relative bg-white">
        <Navbar />
      </div>
      
      <main className="flex-1 pt-32 pb-20">
        {/* Hero */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto text-center mb-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-heading mb-6 tracking-tight">
            How CrewApply <span className="text-primary">Works.</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto">
            A simple, transparent pathway from your job search to embarking your ship.
          </p>
        </section>

        {/* 4-Step Timeline */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto mb-32">
          <div className="space-y-12 relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-8 top-8 bottom-8 w-1 bg-line-soft -z-10"></div>
            
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${step.color}`}>
                  <Icon name={step.icon} size={28} />
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-line-soft flex-1">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Step {i + 1}</span>
                  <h3 className="text-xl font-bold text-heading mb-3">{step.title}</h3>
                  <p className="text-body leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seafarer FAQ Accordion (Simulated) */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-heading">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-line-soft">
                <h4 className="font-bold text-heading text-lg mb-3">{faq.q}</h4>
                <p className="text-body leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
