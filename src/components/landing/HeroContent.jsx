import Link from 'next/link';

export function HeroContent() {
  return (
    <div className="relative z-10 flex flex-col justify-center max-w-2xl pt-32 pb-16 lg:pt-0 lg:pb-12 text-center lg:text-left">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-glass w-fit mx-auto lg:mx-0 mb-6 shadow-sm border border-white/60 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span className="text-xs font-bold tracking-wide text-primary uppercase">Global Opportunities. A Brighter Tomorrow.</span>
      </div>
      
      <h1 className="text-display font-extrabold text-heading leading-[1.1] mb-6 drop-shadow-sm">
        Your Career at Sea, <br className="hidden lg:block" />
        <span className="text-primary">Simplified.</span>
      </h1>
      
      <p className="text-lg text-body lg:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
        Find opportunities, manage your applications, keep your documents ready, and take control of your maritime career — all from one platform.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
        <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary text-md font-bold rounded-pill shadow-md hover:bg-primary-dark transition-all hover:-translate-y-0.5 press flex items-center justify-center gap-2 group">
          Get Started 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        
        <Link href="/jobs" className="w-full sm:w-auto px-8 py-4 bg-glass backdrop-blur-md text-heading text-md font-bold rounded-pill border-2 border-primary/20 hover:bg-white/60 hover:border-primary/40 transition-all press text-center">
          Explore CrewApply
        </Link>
      </div>
    </div>
  );
}
