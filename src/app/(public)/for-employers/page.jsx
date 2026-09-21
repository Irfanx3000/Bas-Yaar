import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";

export default function ForEmployersPage() {
  const values = [
    {
      title: "Pre-vetted Crew Profiles",
      desc: "Source candidates with verified STCW certs, CDC validity, and documented sea service, ready to deploy.",
      icon: "check-circle"
    },
    {
      title: "Smart Rank Matching",
      desc: "Filter by vessel experience (passenger, LNG, bulk carrier), specific ranks, and contract availability dates.",
      icon: "search"
    },
    {
      title: "Efficient Hiring Pipeline",
      desc: "Experience streamlined candidate shortlisting and direct communications all from one central dashboard.",
      icon: "chart-bar"
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
            Hire Verified Maritime & Cruise Talent <span className="text-primary">Faster.</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto">
            Connect directly with qualified seafarers worldwide. Streamline your maritime recruitment with our smart matching tools.
          </p>
        </section>

        {/* Value Proposition Grid */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-line-soft hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <Icon name={v.icon} size={24} />
                </div>
                <h3 className="text-xl font-bold text-heading mb-4">{v.title}</h3>
                <p className="text-body leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Inquiry Form / Lead Capture */}
        <section className="px-6 lg:px-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-line-soft">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-heading mb-4">Partner With Us</h2>
              <p className="text-body">Tell us about your crewing needs and our team will get in touch to set up your employer account.</p>
            </div>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Full Name</label>
                  <input type="text" className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Company / Agency Name</label>
                  <input type="text" className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Oceanic Shipping Ltd." />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Work Email</label>
                  <input type="email" className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="john@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-heading mb-2">Fleet Size</label>
                  <select className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option>1-10 Vessels</option>
                    <option>11-50 Vessels</option>
                    <option>50+ Vessels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-heading mb-2">Immediate Hiring Needs</label>
                <textarea rows={4} className="w-full bg-surface border border-line-soft rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" placeholder="Tell us which ranks or vessel types you are urgently hiring for..."></textarea>
              </div>
              
              <button type="button" className="w-full bg-primary text-white font-bold rounded-xl py-4 hover:bg-primary-hover transition-colors shadow-sm">
                Submit Inquiry
              </button>
            </form>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
