import { Icon } from '@/components/ui/Icon';

export function TrustIndicators() {
  return (
    <div className="relative z-10 w-full mt-16 lg:mt-0 flex flex-col items-center pb-8">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 bg-glass backdrop-blur-md px-8 py-6 md:py-5 rounded-3xl shadow-sm border border-white/60 w-full max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-start">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Icon name="user" size={20} />
          </div>
          <span className="text-sm font-extrabold text-heading">Built for Maritime Professionals</span>
        </div>
        
        <div className="hidden md:block w-px h-12 bg-line-divider/20"></div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-start">
          <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center text-success-text shrink-0 shadow-sm">
            <Icon name="check-circle" size={20} />
          </div>
          <span className="text-sm font-extrabold text-heading">Trusted by Crew Worldwide</span>
        </div>
        
        <div className="hidden md:block w-px h-12 bg-line-divider/20"></div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-start">
          <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center text-secondary-dark shrink-0 shadow-sm">
            <Icon name="ship" size={22} />
          </div>
          <span className="text-sm font-extrabold text-heading">A Smarter Way to Build Your Career</span>
        </div>

      </div>

      {/* Scroll Cue (Mobile Only) */}
      <div className="mt-12 flex flex-col items-center text-muted lg:hidden animate-bounce">
        <span className="text-xs font-bold mb-2 uppercase tracking-wide">Scroll to explore</span>
        <Icon name="chevron-down" size={16} />
      </div>
    </div>
  );
}
