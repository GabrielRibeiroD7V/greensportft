import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import banner1Asset from '@/assets/banner-futebol-comeca.png.asset.json';
import banner2Asset from '@/assets/banner-bola-rolando.png.asset.json';
import banner3Asset from '@/assets/banner-monte-seu-bilhete.png.asset.json';

const BANNERS = [
  {
    id: 1,
    image: banner1Asset.url,
    link: '/football',
    search: { tab: 'all' },
    alt: 'O Futebol Começa Aqui'
  },
  {
    id: 2,
    image: banner2Asset.url,
    link: '/football',
    search: { tab: 'live' },
    alt: 'A Bola Já Está Rolando'
  },
  {
    id: 3,
    image: banner3Asset.url,
    link: '/football',
    search: { tab: 'all' },
    alt: 'Monte Seu Bilhete'
  }
];

export function HomeBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <div 
      className="relative group w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Desktop/Tablet Carousel */}
      <div className="hidden md:block relative w-full overflow-hidden px-4 md:px-0">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 85}%)` }}
        >
          {BANNERS.map((banner, index) => (
            <div 
              key={banner.id}
              className={`min-w-[85%] px-2 transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-60'}`}
            >
              <div 
                className="relative aspect-[3/1] w-full rounded-2xl overflow-hidden cursor-pointer shadow-xl border border-slate-800/50"
                onClick={() => navigate({ to: banner.link as any, search: banner.search as any })}
              >
                <img 
                  src={banner.image} 
                  alt={banner.alt}
                  className="w-full h-full object-cover select-none"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          ))}
          {/* Partial next slide view hack - adding a duplicate of first slide at the end if needed for smooth wrap, 
              but for this fixed width we just let the last one show white space or wrap */}
        </div>
      </div>

      {/* Mobile Swipeable Carousel (CSS Scroll Snap) */}
      <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full px-4 gap-4">
        {BANNERS.map((banner, index) => (
          <div 
            key={banner.id}
            className="min-w-full snap-center"
            onClick={() => navigate({ to: banner.link as any, search: banner.search as any })}
          >
            <div className="relative aspect-[3/1] w-full rounded-xl overflow-hidden shadow-lg border border-slate-800/50">
              <img 
                src={banner.image} 
                alt={banner.alt}
                className="w-full h-full object-contain bg-black"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Controls */}
      <button 
        onClick={prevSlide}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button 
        onClick={nextSlide}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${currentIndex === index ? 'bg-green-500 w-4' : 'bg-slate-600'}`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
