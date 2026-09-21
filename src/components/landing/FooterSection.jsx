import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export function FooterSection() {
  return (
    <>
      {/* Pre-Footer CTA Banner */}
      <section className="w-full bg-[#f8fafc] px-6 lg:px-12 pb-12 lg:pb-24">
        <div className="max-w-[1440px] mx-auto">
          <div className="relative w-full bg-cover bg-center overflow-hidden py-16 sm:py-24 px-6 md:px-16 rounded-[2rem] shadow-sm">
            
            <div className="absolute inset-0 z-0">
               <Image 
                 src="/banner 3.png"
                 alt="Start Your Next Chapter"
                 fill
                 className="object-cover object-center"
               />
               {/* Dark/Blue gradient overlay so text is crisp */}
               <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f3a]/90 via-[#0b1f3a]/60 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
              
              <div className="flex-1 max-w-xl">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Your Next Chapter Starts Here.
                </h2>
                <p className="text-white/90 text-sm sm:text-base mb-8 max-w-md">
                  Create your CrewApply profile and take control of your maritime career.
                </p>
                <Link href="/signup" className="bg-primary text-white font-semibold px-8 py-3 rounded-full hover:bg-primary-hover transition-colors inline-block shadow-lg hover:shadow-xl hover:scale-105 transform">
                  Get Started
                </Link>
              </div>

              {/* Right Accent (Script Text) */}
              <div className="hidden md:block flex-1 text-right self-start pt-8 pr-8">
                <p className="text-2xl font-medium text-white/90 inline-block drop-shadow-md" style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(-4deg)' }}>
                  Same Oceans. Bigger Opportunities.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Main Footer Navigation */}
      <footer className="w-full bg-white border-t border-line-soft pt-12 pb-8 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
            
            {/* Column 1: Brand & Socials */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:col-span-4">
              <Link href="/" className="flex items-center gap-2 mb-3">
                 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                   <Icon name="ship" size={16} />
                 </div>
                 <span className="font-bold text-xl tracking-tight text-heading">CrewApply</span>
              </Link>
              <p className="text-sm text-body mt-3 mb-6 max-w-xs leading-relaxed">
                Building brighter futures for maritime professionals across the globe.
              </p>
              <div className="flex items-center gap-3">
                {['linkedin', 'instagram', 'youtube', 'facebook', 'twitter'].map((social, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-full bg-surface border border-line-soft flex items-center justify-center text-body hover:text-primary hover:border-primary transition-colors">
                    <Icon name={social} size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Middle Section: Quick Links & Support side-by-side on mobile */}
            <div className="grid grid-cols-2 gap-8 lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
              {/* Column 2: Quick Links */}
              <div className="flex flex-col">
                <h4 className="font-bold text-heading text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
                <ul className="flex flex-col gap-3 text-sm text-body">
                  {['For Crew', 'How It Works', 'Career Support', 'For Employers', 'About Us'].map((item, i) => (
                    <li key={i}><Link href="#" className="hover:text-primary transition-colors">{item}</Link></li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Support */}
              <div className="flex flex-col">
                <h4 className="font-bold text-heading text-sm mb-4 uppercase tracking-wider">Support</h4>
                <ul className="flex flex-col gap-3 text-sm text-body">
                  {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item, i) => (
                    <li key={i}><Link href="#" className="hover:text-primary transition-colors">{item}</Link></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 4: Get the App */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:col-span-3">
              <h4 className="font-bold text-heading text-sm mb-4 uppercase tracking-wider hidden lg:block">Get the App</h4>
              <p className="text-xs text-body mb-3 hidden lg:block">Available on the</p>
              
              <div className="flex flex-row sm:flex-col lg:flex-col gap-3 justify-center lg:justify-start w-full">
                {/* HIDDEN — App Store badge, until the iOS app is published. Uncomment to restore.
                <a href="#" className="flex-1 sm:flex-none flex items-center justify-center lg:justify-start gap-2 bg-heading text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-heading/90 transition-colors w-full lg:max-w-[160px]">
                  <Icon name="apple" size={20} className="shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[9px] sm:text-[10px] leading-none mb-1 opacity-80">Download on the</span>
                    <span className="text-xs sm:text-sm font-semibold leading-none">App Store</span>
                  </div>
                </a>
                */}
                <a href="#" className="flex-1 sm:flex-none flex items-center justify-center lg:justify-start gap-2 bg-heading text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-heading/90 transition-colors w-full lg:max-w-[160px]">
                  <Icon name="google-play" size={18} className="shrink-0" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[9px] sm:text-[10px] leading-none mb-1 opacity-80">GET IT ON</span>
                    <span className="text-xs sm:text-sm font-semibold leading-none">Google Play</span>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar / Sub-footer */}
          <div className="border-t border-line-soft pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-body">
            <p>© {new Date().getFullYear()} CrewApply. All rights reserved.</p>
            <p className="font-medium">People at Sea. Progress on Land.</p>
          </div>

        </div>
      </footer>
    </>
  );
}
