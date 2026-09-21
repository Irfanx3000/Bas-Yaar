import { Navbar } from "@/components/landing/Navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import { Icon } from "@/components/ui/Icon";

export default function AboutUsPage() {
  const values = [
    {
      title: "Transparency First",
      desc: "Zero hidden fees for crew and verified legitimate listings only.",
      icon: "eye"
    },
    {
      title: "Crew-Centric Design",
      desc: "Designed for mobile-first seafarers working on-board and ashore.",
      icon: "user"
    },
    {
      title: "Industry Compliance",
      desc: "Fully aligned with MLC 2006 standards and modern maritime hiring practices.",
      icon: "check-circle"
    }
  ];

  const stats = [
    { value: "15k+", label: "Registered Crew" },
    { value: "200+", label: "Vessel Types" },
    { value: "50+", label: "Partner Agencies" }
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
            Bridging the Gap Between Seafarers and <span className="text-primary block md:inline mt-2 md:mt-0">Global Opportunities.</span>
          </h1>
        </section>

        {/* Mission Statement */}
        <section className="px-6 lg:px-12 max-w-4xl mx-auto mb-24 text-center">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Icon name="ship" size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-medium text-heading leading-relaxed">
            "Built for the people who keep the world moving. We empower maritime professionals with modern digital tools to manage their careers with dignity, transparency, and ease."
          </h2>
        </section>

        {/* Core Values */}
        <section className="px-6 lg:px-12 max-w-7xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h3 className="text-sm font-bold tracking-widest text-muted uppercase mb-2">Our Foundation</h3>
            <h2 className="text-3xl font-bold text-heading">Core Values</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-line-soft text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Icon name={v.icon} size={24} />
                </div>
                <h4 className="text-xl font-bold text-heading mb-4">{v.title}</h4>
                <p className="text-body leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Strip */}
        <section className="px-6 lg:px-12 max-w-5xl mx-auto">
          <div className="bg-heading rounded-[2rem] p-10 md:p-12 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-line-soft/20">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center pt-6 md:pt-0 first:pt-0">
                  <span className="text-4xl md:text-5xl font-extrabold text-white mb-2">{stat.value}</span>
                  <span className="text-white/80 font-medium uppercase tracking-wider text-sm">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <FooterSection />
    </div>
  );
}
