import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";

export default function CareerSupportPage() {
  const resources = [
    {
      title: "1-on-1 Mentorship & Consultancy",
      desc: "Connect with experienced Chief Engineers and Captains to map out your career progression and address specific challenges.",
      icon: "user",
      link: "/consultancy"
    },
    {
      title: "Interview Preparation",
      desc: "Practice technical questions, review maritime regulations, and undergo behavioral prep to ace your next promotion interview.",
      icon: "education",
      link: "/interview-prep"
    },
    {
      title: "STCW & Document Guidance",
      desc: "Access comprehensive checklists, renewal reminder workflows, and regulatory updates to stay compliant.",
      icon: "file-alt",
      link: "/documents"
    },
    {
      title: "Resume & CV Optimization",
      desc: "Learn maritime-standard CV formatting tips to highlight your sea time and ensure your profile stands out to manning agencies.",
      icon: "pencil-alt",
      link: "/resume"
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
            Empowering Maritime Professionals at <span className="text-primary">Every Step.</span>
          </h1>
          <p className="text-lg md:text-xl text-body max-w-3xl mx-auto">
            From your cadetship to earning your Master's ticket, we provide the tools and guidance you need to succeed.
          </p>
        </section>

        {/* Resource Hub Cards */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resources.map((res, i) => (
              <Link href={res.link} key={i} className="group bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-line-soft hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full cursor-pointer">
                <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon name={res.icon} size={24} />
                </div>
                <h3 className="text-2xl font-bold text-heading mb-4 group-hover:text-primary transition-colors">{res.title}</h3>
                <p className="text-body leading-relaxed flex-1 mb-6">{res.desc}</p>
                <div className="flex items-center gap-2 text-primary font-bold">
                  Explore Resource <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Card */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto">
          <div className="bg-heading rounded-3xl p-10 md:p-16 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Need personal career guidance?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Book a dedicated session with an industry expert today and navigate your maritime career with confidence.
              </p>
              <Link href="/consultancy" className="inline-flex items-center justify-center bg-primary text-white rounded-full px-8 py-4 font-bold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:scale-105 transform">
                Book an Expert
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
