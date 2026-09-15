"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export function TestimonialsSection() {
  const scrollRef = useRef(null);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const testimonials = [
    {
      quote: "“CrewApply made it so much easier for me to manage my applications and keep track of everything in one place.”",
      author: "Rohit S.",
      role: "Deck Officer",
      image: "https://images.unsplash.com/photo-1577744386762-cb6daea7d341?auto=format&fit=crop&w=400&q=80"
    },
    {
      quote: "“A very useful platform for anyone looking to build a career in the cruise industry. The document management feature is a game changer.”",
      author: "Priya M.",
      role: "Hospitality Crew",
      image: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=400&q=80"
    },
    {
      quote: "“The best part is the application tracking. I always know the status, and the consultation feature really helped me plan my next step.”",
      author: "Ahmed K.",
      role: "Engine Cadet",
      image: "https://images.unsplash.com/photo-1504322676766-417240f993d0?auto=format&fit=crop&w=400&q=80"
    },
    {
      quote: "“I finally feel in control of my maritime career. The interface is clean, fast, and gives me exactly what I need.”",
      author: "Carlos D.",
      role: "Chief Engineer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
    }
  ];

  return (
    <section className="w-full bg-[#f8fafc] py-12 lg:py-24 px-6 lg:px-12 border-t border-line-soft">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 lg:mb-12 gap-6">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <h2 className="text-sm font-bold tracking-wide text-muted uppercase mb-2">
              REAL PEOPLE. REAL JOURNEYS.
            </h2>
            <h3 className="text-h2 lg:text-h1 font-extrabold leading-tight mb-2">
              <span className="text-heading">Trusted by </span><br className="hidden lg:block" />
              <span className="text-primary">Maritime Professionals.</span>
            </h3>
            <p className="text-lg text-body font-medium block lg:hidden mt-4">
              Hear from crew members who've found better opportunities and taken control of their careers with CrewApply.
            </p>
          </div>
          <div className="hidden lg:flex shrink-0">
            <Link href="/stories" className="text-primary font-bold hover:gap-2 transition-all flex items-center gap-1">
              View More Stories <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Testimonials Cards Container Wrapper */}
        <div className="relative w-full">
          {/* Desktop Arrows */}
          <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 -right-4 justify-between pointer-events-none z-10">
            <button onClick={() => scroll('left')} className="pointer-events-auto w-10 h-10 rounded-full bg-white border border-line-soft shadow-sm flex items-center justify-center text-primary hover:bg-gray-50 transition-colors -ml-5">
              <Icon name="chevron-left" size={16} />
            </button>
            <button onClick={() => scroll('right')} className="pointer-events-auto w-10 h-10 rounded-full bg-white border border-line-soft shadow-sm flex items-center justify-center text-primary hover:bg-gray-50 transition-colors -mr-5">
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-6 pb-4">
            {testimonials.map((t, i) => (
              <div key={i} className="min-w-[280px] w-[80vw] max-w-[320px] md:min-w-[340px] md:w-[calc(33.333%-16px)] md:shrink-0 snap-center bg-white border border-line-soft rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-center gap-4 md:gap-4 hover:shadow-md transition-shadow">
                
                <div className="relative w-full md:w-28 md:shrink-0 aspect-[4/3] md:aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center group cursor-pointer mb-4 md:mb-0">
                   <img src={t.image} alt={t.author} className="absolute inset-0 w-full h-full object-cover" />
                   {/* Video Play Button Overlay */}
                   <div className="w-10 h-10 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10 relative">
                     <Icon name="play" size={16} className="ml-1" />
                   </div>
                </div>
                
                <div className="flex flex-col flex-1 w-full text-left">
                  <p className="text-body text-sm mb-4 flex-1 font-medium italic">{t.quote}</p>
                  <div>
                    <h4 className="font-bold text-heading text-sm">{t.author}</h4>
                    <p className="text-xs text-body">{t.role}</p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Mobile specific layout additions */}
        <div className="md:hidden">
          {/* Pagination Dots (Visual only) */}
          <div className="flex justify-center items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <div className="w-2 h-2 rounded-full bg-line-soft"></div>
            <div className="w-2 h-2 rounded-full bg-line-soft"></div>
          </div>

          {/* Bottom Call-to-Action Banner */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex items-center justify-between gap-4 mt-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100/70 w-12 h-12 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Icon name="users" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-heading text-sm sm:text-base leading-tight">A Smarter Way to Build Your Career.</h4>
                <p className="text-xs text-body mt-1">Join thousands of maritime professionals who trust CrewApply.</p>
              </div>
            </div>
            <Link href="/signup" className="w-10 h-10 shrink-0 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-hover transition-colors shadow-sm">
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
          
          <div className="text-center mt-6">
            <Link href="/stories" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
              View More Stories <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
