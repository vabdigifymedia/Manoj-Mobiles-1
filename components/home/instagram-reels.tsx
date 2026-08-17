import React from 'react';
import { FaInstagram } from 'react-icons/fa6';
import type { InstagramReelResponseDTO } from '@/lib/types';

export function InstagramReels({ reels }: { reels: InstagramReelResponseDTO[] }) {
  if (!reels || reels.length === 0) return null;

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
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-pink-50 px-5 py-2 text-sm font-bold text-pink-600 hover:bg-pink-100 transition-colors"
        >
          Follow @manojmobiles
        </a>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {reels.map((reel) => (
          <div key={reel.id} className="snap-center shrink-0 w-[300px] h-[533px] bg-muted rounded-2xl overflow-hidden shadow-sm border border-border relative">
            {/* The Instagram Embed Iframe */}
            <iframe 
              src={`https://www.instagram.com/reel/${reel.reelId}/embed`}
              width="300" 
              height="533" 
              frameBorder="0" 
              scrolling="no" 
              allowTransparency={true}
              allow="encrypted-media"
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center sm:hidden">
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-6 py-3 text-sm font-bold text-pink-600 hover:bg-pink-100 transition-colors"
        >
          Follow @manojmobiles on Instagram
        </a>
      </div>
    </section>
  );
}
