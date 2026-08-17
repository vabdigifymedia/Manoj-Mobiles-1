"use client"
import React, { useEffect, useRef } from 'react';
import { FaInstagram, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import type { InstagramReelResponseDTO } from '@/lib/types';

export function InstagramReels({ reels }: { reels: InstagramReelResponseDTO[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const processEmbeds = () => {
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      }
    };

    if (!(window as any).instgrm) {
      const s = document.createElement('script');
      s.async = true;
      s.src = '//www.instagram.com/embed.js';
      s.onload = processEmbeds;
      document.body.appendChild(s);
    } else {
      // Small timeout ensures React has finished mounting the blockquotes
      setTimeout(processEmbeds, 100);
    }
  }, [reels]);

  // Robust frontend extraction in case the admin pasted a full link and the backend missed it
  const getReelId = (input: string) => {
    if (!input) return '';
    if (input.includes('instagram.com')) {
      const match = input.match(/\/(?:reel|reels|p|tv)\/([^/?#]+)/);
      if (match) return match[1];
    }
    return input.trim();
  };

  const validReels = reels
    ?.map(reel => ({ ...reel, extractedId: getReelId(reel.reelId) }))
    .filter(reel => reel.extractedId && !reel.extractedId.includes('http') && !reel.extractedId.includes('/')) || [];

  if (validReels.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350; // approximate width of one card + gap
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <FaInstagram className="text-pink-600" />
            Trending Reels
          </h2>
          <p className="mt-2 text-muted-foreground">Follow us on Instagram for latest unboxings and offers!</p>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="https://www.instagram.com/manojmobiles_?igsh=YXAxd3Z1OXQ2MGN5&igsi=YXAxd3Z1OXQ2MGN5" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-pink-50 px-5 py-2 text-sm font-bold text-pink-600 hover:bg-pink-100 transition-colors"
          >
            Follow @manojmobiles_
          </a>
        </div>
      </div>

      <div className="relative group mt-4">
        {/* Left Edge Button */}
        <button 
          onClick={() => scroll('left')} 
          className="hidden md:flex absolute -left-4 lg:left-0 top-[190px] -translate-y-1/2 z-10 p-4 rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-xl border border-border hover:bg-pink-50 hover:text-pink-600 hover:scale-110 transition-all focus:outline-none opacity-0 group-hover:opacity-100"
          aria-label="Scroll Left"
        >
          <FaChevronLeft size={20} className="ml-[-2px]" />
        </button>

        <div ref={scrollContainerRef} className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {validReels.map((reel) => (
            <div key={reel.id} className="snap-center shrink-0 w-[195px] h-[340px] sm:w-[229px] sm:h-[400px] relative">
              <div className="absolute top-0 left-0 w-[229px] h-[400px] bg-black rounded-2xl overflow-hidden shadow-sm border border-border transform scale-[0.85] sm:scale-100 origin-top-left">
                {/* Simple crop wrapper */}
                <div className="absolute w-[326px] -left-[49px] -top-[56px]">
                  <blockquote
                    className="instagram-media"
                    data-instgrm-permalink={`https://www.instagram.com/reel/${reel.extractedId}/?utm_source=ig_embed&utm_campaign=loading`}
                    data-instgrm-version="14"
                    style={{ background: '#FFF', border: '0', margin: '0', maxWidth: '326px', minWidth: '326px', padding: '0', width: '99.375%' }}
                  >
                  </blockquote>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Edge Button */}
        <button 
          onClick={() => scroll('right')} 
          className="hidden md:flex absolute -right-4 lg:right-0 top-[190px] -translate-y-1/2 z-10 p-4 rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-xl border border-border hover:bg-pink-50 hover:text-pink-600 hover:scale-110 transition-all focus:outline-none opacity-0 group-hover:opacity-100"
          aria-label="Scroll Right"
        >
          <FaChevronRight size={20} className="mr-[-2px]" />
        </button>
      </div>

      <div className="mt-4 text-center sm:hidden">
        <a
          href="https://www.instagram.com/manojmobiles_?igsh=YXAxd3Z1OXQ2MGN5&igsi=YXAxd3Z1OXQ2MGN5"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-6 py-3 text-sm font-bold text-pink-600 hover:bg-pink-100 transition-colors"
        >
          Follow @manojmobiles_ on Instagram
        </a>
      </div>
    </section>
  );
}
